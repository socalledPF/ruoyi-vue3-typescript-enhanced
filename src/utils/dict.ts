import useDictStore from '@/store/modules/dict'
import { getDicts } from '@/api/system/dict/data'
import type { SysDictData } from '@/types'

interface DictOption {
  label: string
  value: string
  elTagType?: string
  elTagClass?: string
}

/**
 * 获取字典数据
 */
export function useDict(...args: string[]) {
  const res = ref<Record<string, DictOption[]>>({})
  return (() => {
    args.forEach((dictType) => {
      res.value[dictType] = []
      const dicts = useDictStore().getDict(dictType)
      if (dicts) {
        res.value[dictType] = dicts as DictOption[]
      } else {
        getDicts(dictType).then(resp => {
          res.value[dictType] = (resp.data || []).map((p: SysDictData) => ({
            label: p.dictLabel || "",
            value: p.dictValue || "",
            elTagType: p.listClass,
            elTagClass: p.cssClass
          }))
          useDictStore().setDict(dictType, res.value[dictType])
        })
      }
    })
    return toRefs(res.value)
  })()
}
