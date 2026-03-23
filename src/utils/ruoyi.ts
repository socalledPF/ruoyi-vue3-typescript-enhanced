/**
 * Common utility methods
 * Copyright (c) 2019 ruoyi
 */

interface DictItemLike {
  value: string | number
  label: string
}

type DictSource = DictItemLike[] | Record<string, DictItemLike>

// Date format
export function parseTime(time: string | number | Date, pattern?: string): string | null {
  if (arguments.length === 0 || !time) {
    return null
  }
  const format = pattern || '{y}-{m}-{d} {h}:{i}:{s}'
  let date: Date
  if (time instanceof Date) {
    date = time
  } else {
    let normalizedTime: string | number = time
    if (typeof normalizedTime === 'string' && /^[0-9]+$/.test(normalizedTime)) {
      normalizedTime = parseInt(normalizedTime)
    } else if (typeof normalizedTime === 'string') {
      normalizedTime = normalizedTime.replace(/-/g, '/').replace('T', ' ').replace(/\.[\d]{3}/g, '')
    }
    if (typeof normalizedTime === 'number' && normalizedTime.toString().length === 10) {
      normalizedTime = normalizedTime * 1000
    }
    date = new Date(normalizedTime)
  }

  const formatObj: Record<string, number> = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }

  return format.replace(/{(y|m|d|h|i|s|a)+}/g, (result: string, key: string) => {
    let value: string | number = formatObj[key]
    if (key === 'a') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][Number(value)]
    if (result.length > 0 && Number(value) < 10) {
      value = '0' + value
    }
    return String(value || 0)
  })
}

// Reset form
export function resetForm(this: { $refs?: Record<string, { resetFields: () => void } | undefined> }, refName: string): void {
  this.$refs?.[refName]?.resetFields()
}

// Add date range
export function addDateRange(params: Record<string, unknown>, dateRange: string[], propName?: string): Record<string, unknown> {
  const search = params as Record<string, unknown> & { params?: Record<string, unknown> }
  search.params = typeof search.params === 'object' && search.params !== null && !Array.isArray(search.params) ? search.params : {}
  const range = Array.isArray(dateRange) ? dateRange : []
  if (propName === undefined) {
    search.params.beginTime = range[0]
    search.params.endTime = range[1]
  } else {
    search.params['begin' + propName] = range[0]
    search.params['end' + propName] = range[1]
  }
  return search
}

// Display dict label
export function selectDictLabel(datas: DictSource, value: string | number): string {
  if (value === undefined) {
    return ''
  }
  const dictList = Array.isArray(datas) ? datas : Object.values(datas)
  const target = dictList.find((item: DictItemLike) => String(item.value) === String(value))
  return target ? target.label : String(value)
}

// Display dict labels (string/array)
export function selectDictLabels(datas: DictSource, value: string | string[], separator = ','): string {
  if (value === undefined || value.length === 0) {
    return ''
  }
  const dictList = Array.isArray(datas) ? datas : Object.values(datas)
  const values = Array.isArray(value) ? value : value.split(separator)
  return values
    .map((current: string) => {
      const target = dictList.find((item: DictItemLike) => String(item.value) === String(current))
      return target ? target.label : current
    })
    .join(separator)
}

// String format (%s)
export function sprintf(str: string, ...args: unknown[]): string {
  let flag = true
  let i = 0
  str = str.replace(/%s/g, () => {
    const arg = args[i++]
    if (typeof arg === 'undefined') {
      flag = false
      return ''
    }
    return String(arg)
  })
  return flag ? str : ''
}

// Convert undefined/null into ""
export function parseStrEmpty(str: unknown): string {
  if (str === null || str === undefined || str === 'undefined' || str === 'null') {
    return ''
  }
  return String(str)
}

// Merge object data
export function mergeRecursive(source: Record<string, unknown>, target: Record<string, unknown>): Record<string, unknown> {
  for (const p in target) {
    const targetValue = target[p]
    if (typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)) {
      source[p] = mergeRecursive((source[p] as Record<string, unknown>) || {}, targetValue as Record<string, unknown>)
    } else {
      source[p] = targetValue
    }
  }
  return source
}

/**
 * Build tree structure data
 * @param data data source
 * @param id id field (default: 'id')
 * @param parentId parent field (default: 'parentId')
 * @param children children field (default: 'children')
 */
export function handleTree<T extends Record<string, unknown>>(data: T[], id?: string, parentId?: string, children?: string): T[] {
  const config = {
    id: id || 'id',
    parentId: parentId || 'parentId',
    childrenList: children || 'children'
  }

  const childrenListMap: Record<string, T> = {}
  const tree: T[] = []

  for (const item of data) {
    const mutableItem = item as Record<string, unknown>
    const itemId = String(mutableItem[config.id])
    childrenListMap[itemId] = item
    if (!Array.isArray(mutableItem[config.childrenList])) {
      mutableItem[config.childrenList] = []
    }
  }

  for (const item of data) {
    const itemRecord = item as Record<string, unknown>
    const parentItemId = String(itemRecord[config.parentId])
    const parentObj = childrenListMap[parentItemId]
    if (!parentObj) {
      tree.push(item)
    } else {
      const parentRecord = parentObj as Record<string, unknown>
      ;(parentRecord[config.childrenList] as T[]).push(item)
    }
  }
  return tree
}

/**
 * Params processing
 * @param params request params
 */
export function tansParams(params: Record<string, unknown>): string {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName]
    const part = encodeURIComponent(propName) + '='
    if (value !== null && value !== '' && typeof value !== 'undefined') {
      if (typeof value === 'object') {
        for (const key of Object.keys(value as Record<string, unknown>)) {
          const nestedValue = (value as Record<string, unknown>)[key]
          if (nestedValue !== null && nestedValue !== '' && typeof nestedValue !== 'undefined') {
            const nestedParam = `${propName}[${key}]`
            const subPart = encodeURIComponent(nestedParam) + '='
            result += subPart + encodeURIComponent(String(nestedValue)) + '&'
          }
        }
      } else {
        result += part + encodeURIComponent(String(value)) + '&'
      }
    }
  }
  return result
}

// Return normalized path
export function getNormalPath(p: string): string {
  if (p.length === 0 || !p || p === 'undefined') {
    return p
  }
  const res = p.replace('//', '/')
  if (res[res.length - 1] === '/') {
    return res.slice(0, res.length - 1)
  }
  return res
}

// Validate blob format
export function blobValidate(data: Blob): boolean {
  return data.type !== 'application/json'
}
