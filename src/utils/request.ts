import axios from 'axios'
import { ElNotification, ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { tansParams, blobValidate } from '@/utils/ruoyi'
import cache from '@/plugins/cache'
import { saveAs } from 'file-saver'
import useUserStore from '@/store/modules/user'
import { AxiosHeaders } from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

interface RequestControlHeaders {
  isToken?: boolean
  repeatSubmit?: boolean
  interval?: number
}

interface ApiResponseData {
  code?: number
  msg?: string
  [key: string]: unknown
}

let downloadLoadingInstance: ReturnType<typeof ElLoading.service>
export const isRelogin = { show: false }

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const headers = config.headers || new AxiosHeaders()
    config.headers = headers
    const controlHeaders = headers as unknown as RequestControlHeaders

    const isToken = controlHeaders.isToken === false
    const isRepeatSubmit = controlHeaders.repeatSubmit === false
    const interval = Number(controlHeaders.interval || 1000)

    if (getToken() && !isToken) {
      headers.set('Authorization', 'Bearer ' + getToken())
    }

    if (config.method === 'get' && config.params && config.url) {
      let url = config.url + '?' + tansParams(config.params as Record<string, unknown>)
      url = url.slice(0, -1)
      config.params = {}
      config.url = url
    }

    if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
      const requestObj = {
        url: config.url || '',
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : String(config.data ?? ''),
        time: Date.now()
      }

      const requestSize = Object.keys(JSON.stringify(requestObj)).length
      const limitSize = 5 * 1024 * 1024
      if (requestSize >= limitSize) {
        console.warn(`[${requestObj.url}]: request payload too large to check duplicate submit`)
        return config
      }

      const sessionObj = cache.session.getJSON<{ url?: string; data?: string; time?: number }>('sessionObj')
      if (!sessionObj) {
        cache.session.setJSON('sessionObj', requestObj)
      } else {
        const sUrl = sessionObj.url || ''
        const sData = sessionObj.data || ''
        const sTime = sessionObj.time || 0
        if (sData === requestObj.data && requestObj.time - sTime < interval && sUrl === requestObj.url) {
          const message = 'Data is being processed, please do not submit repeatedly.'
          console.warn(`[${sUrl}]: ${message}`)
          return Promise.reject(new Error(message))
        }
        cache.session.setJSON('sessionObj', requestObj)
      }
    }

    return config
  },
  (error: unknown) => {
    console.log(error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  ((res: AxiosResponse<unknown>) => {
    const responseData = (typeof res.data === 'object' && res.data !== null ? res.data : {}) as ApiResponseData
    const code = responseData.code || 200
    const msg = errorCode[code] || responseData.msg || errorCode.default

    const responseType = (res.request as { responseType?: string }).responseType
    if (responseType === 'blob' || responseType === 'arraybuffer') {
      return res.data
    }

    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true
        ElMessageBox.confirm('Login status has expired. You can stay on this page or login again.', 'System Prompt', {
          confirmButtonText: 'Relogin',
          cancelButtonText: 'Cancel',
          type: 'warning'
        })
          .then(() => {
            isRelogin.show = false
            useUserStore().logOut().then(() => {
              location.href = '/index'
            })
          })
          .catch(() => {
            isRelogin.show = false
          })
      }
      return Promise.reject('Invalid session, please login again.')
    }

    if (code === 500) {
      ElMessage({ message: msg, type: 'error' })
      return Promise.reject(new Error(msg))
    }
    if (code === 601) {
      ElMessage({ message: msg, type: 'warning' })
      return Promise.reject(new Error(msg))
    }
    if (code !== 200) {
      ElNotification.error({ title: msg })
      return Promise.reject(new Error(msg))
    }
    return Promise.resolve(responseData)
  }) as unknown as (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
  (error: AxiosError) => {
    console.log('err' + error)
    let message = error.message
    if (message === 'Network Error') {
      message = 'Backend API connection exception'
    } else if (message.includes('timeout')) {
      message = 'System API request timeout'
    } else if (message.includes('Request failed with status code')) {
      message = 'System API ' + message.slice(-3) + ' exception'
    }
    ElMessage({ message, type: 'error', duration: 5 * 1000 })
    return Promise.reject(error)
  }
)

export function download(url: string, params: Record<string, unknown>, filename: string, config?: Record<string, unknown>) {
  downloadLoadingInstance = ElLoading.service({ text: 'Downloading data, please wait...', background: 'rgba(0, 0, 0, 0.7)' })
  return service
    .post<Blob, Blob>(url, params, {
      transformRequest: [(requestParams: Record<string, unknown>) => tansParams(requestParams)],
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'blob',
      ...config
    })
    .then(async (data: Blob) => {
      const isBlob = blobValidate(data)
      if (isBlob) {
        const blob = new Blob([data])
        saveAs(blob, filename)
      } else {
        const resText = await data.text()
        const rspObj = JSON.parse(resText) as { code?: string | number; msg?: string }
        const errKey = String(rspObj.code ?? 'default')
        const errMsg = errorCode[errKey] || rspObj.msg || errorCode.default
        ElMessage.error(errMsg)
      }
      downloadLoadingInstance.close()
    })
    .catch((error: unknown) => {
      console.error(error)
      ElMessage.error('Download failed. Please contact the administrator.')
      downloadLoadingInstance.close()
    })
}

export default service
