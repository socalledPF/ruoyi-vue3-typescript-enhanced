import useTagsViewStore from '@/store/modules/tagsView'
import router from '@/router'
import type { LocationQueryRaw, RouteLocationMatched, RouteLocationRaw } from 'vue-router'
import type { View } from '@/store/modules/tagsView'

interface RouteComponentWithName {
  name?: string
}

interface TabView extends View {
  fullPath?: string
}

function getCurrentView(): TabView {
  return router.currentRoute.value as unknown as TabView
}

function extractRefreshTargetFromMatched(matched: RouteLocationMatched[]): TabView | undefined {
  for (const matchedItem of matched) {
    const components = matchedItem.components as Record<string, RouteComponentWithName> | undefined
    const defaultComponentName = components?.default?.name
    if (defaultComponentName && !['Layout', 'ParentView'].includes(defaultComponentName)) {
      return {
        name: defaultComponentName,
        path: router.currentRoute.value.path,
        query: router.currentRoute.value.query as Record<string, unknown>,
        meta: router.currentRoute.value.meta as Record<string, unknown>
      }
    }
  }
  return undefined
}

export default {
  refreshPage(obj?: TabView) {
    const currentRoute = router.currentRoute.value
    const refreshTarget = obj ?? extractRefreshTargetFromMatched(currentRoute.matched)
    if (!refreshTarget) {
      return Promise.resolve()
    }
    return useTagsViewStore().delCachedView(refreshTarget).then(() => {
      const { path, query } = refreshTarget
      return router.replace({
        path: '/redirect' + path,
        query: query as LocationQueryRaw
      })
    })
  },

  closeOpenPage(obj?: RouteLocationRaw) {
    useTagsViewStore().delView(getCurrentView())
    if (obj !== undefined) {
      return router.push(obj)
    }
  },

  closePage(obj?: TabView) {
    if (obj === undefined) {
      return useTagsViewStore().delView(getCurrentView()).then(({ visitedViews }: { visitedViews: View[] }) => {
        const latestView = visitedViews.slice(-1)[0] as TabView | undefined
        if (latestView?.fullPath) {
          return router.push(latestView.fullPath)
        }
        return router.push('/')
      })
    }
    return useTagsViewStore().delView(obj)
  },

  closeAllPage() {
    return useTagsViewStore().delAllViews()
  },

  closeLeftPage(obj?: TabView) {
    return useTagsViewStore().delLeftTags(obj || getCurrentView())
  },

  closeRightPage(obj?: TabView) {
    return useTagsViewStore().delRightTags(obj || getCurrentView())
  },

  closeOtherPage(obj?: TabView) {
    return useTagsViewStore().delOthersViews(obj || getCurrentView())
  },

  openPage(title: string, url: string, params?: LocationQueryRaw) {
    const obj: TabView = { path: url, meta: { title } }
    useTagsViewStore().addView(obj)
    return router.push({ path: url, query: params })
  },

  updatePage(obj: TabView) {
    return useTagsViewStore().updateVisitedView(obj)
  }
}
