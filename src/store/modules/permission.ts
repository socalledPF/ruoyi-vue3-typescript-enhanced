import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index.vue'
import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'
import type { RouteRecordRaw } from 'vue-router'

// 鍖归厤 views 閲岄潰鎵€鏈夌殑 .vue 鏂囦欢
const modules: Record<string, () => Promise<unknown>> = import.meta.glob('./../../views/**/*.vue')

export interface DynamicRoute {
  path: string
  name?: string | symbol
  hidden?: boolean
  redirect?: string
  component?: string | RouteRecordRaw['component']
  query?: string
  meta?: Record<string, unknown>
  parentPath?: string
  permissions?: string[]
  roles?: string[]
  children?: DynamicRoute[]
  [key: string]: unknown
}

const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [] as RouteRecordRaw[],
    addRoutes: [] as RouteRecordRaw[],
    defaultRoutes: [] as DynamicRoute[],
    topbarRouters: [] as DynamicRoute[],
    sidebarRouters: [] as DynamicRoute[]
  }),
  actions: {
    setRoutes(routes: RouteRecordRaw[]) {
      this.addRoutes = routes
      this.routes = [...(constantRoutes as RouteRecordRaw[]), ...routes]
    },
    setDefaultRoutes(routes: DynamicRoute[]) {
      this.defaultRoutes = [...(constantRoutes as unknown as DynamicRoute[]), ...routes]
    },
    setTopbarRoutes(routes: DynamicRoute[]) {
      this.topbarRouters = routes
    },
    setSidebarRouters(routes: DynamicRoute[]) {
      this.sidebarRouters = routes
    },
    generateRoutes(_roles?: string[]): Promise<DynamicRoute[]> {
      return new Promise(resolve => {
        // 鍚戝悗绔姹傝矾鐢辨暟鎹?
        getRouters().then(res => {
          const sdata = JSON.parse(JSON.stringify(res.data)) as DynamicRoute[]
          const rdata = JSON.parse(JSON.stringify(res.data)) as DynamicRoute[]
          const defaultData = JSON.parse(JSON.stringify(res.data)) as DynamicRoute[]
          const sidebarRoutes = filterAsyncRouter(sdata)
          const rewriteRoutes = filterAsyncRouter(rdata, null, true)
          const defaultRoutes = filterAsyncRouter(defaultData)
          const asyncRoutes = filterDynamicRoutes(dynamicRoutes as unknown as DynamicRoute[])

          asyncRoutes.forEach(route => {
            router.addRoute(route as RouteRecordRaw)
          })

          this.setRoutes(rewriteRoutes as unknown as RouteRecordRaw[])
          this.setSidebarRouters([...(constantRoutes as unknown as DynamicRoute[]), ...sidebarRoutes])
          this.setDefaultRoutes(sidebarRoutes)
          this.setTopbarRoutes(defaultRoutes)
          resolve(rewriteRoutes)
        })
      })
    }
  }
})

// 閬嶅巻鍚庡彴浼犳潵鐨勮矾鐢卞瓧绗︿覆锛岃浆鎹负缁勪欢瀵硅薄
function filterAsyncRouter(asyncRouterMap: DynamicRoute[], lastRouter: DynamicRoute | null = null, type = false): DynamicRoute[] {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }

    if (typeof route.component === 'string') {
      // Layout ParentView 缁勪欢鐗规畩澶勭悊
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = loadView(route.component)
      }
    }

    if (route.children && route.children.length > 0) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route.children
      delete route.redirect
    }
    return true
  })
}

function filterChildren(childrenMap: DynamicRoute[], lastRouter: DynamicRoute | null = null): DynamicRoute[] {
  let children: DynamicRoute[] = []
  childrenMap.forEach(el => {
    el.path = lastRouter ? `${lastRouter.path}/${el.path}` : el.path
    if (el.children && el.children.length > 0 && el.component === 'ParentView') {
      children = children.concat(filterChildren(el.children, el))
    } else {
      children.push(el)
    }
  })
  return children
}

// 鍔ㄦ€佽矾鐢遍亶鍘嗭紝楠岃瘉鏄惁鍏峰鏉冮檺
export function filterDynamicRoutes(routes: DynamicRoute[]): DynamicRoute[] {
  const res: DynamicRoute[] = []
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export const loadView = (view: string): RouteRecordRaw['component'] | undefined => {
  let res: RouteRecordRaw['component'] | undefined
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (dir === view) {
      res = modules[path] as RouteRecordRaw['component']
      break
    }
  }
  return res
}

export default usePermissionStore
