<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <span v-if="item.redirect === 'noRedirect' || index == levelList.length - 1" class="no-redirect">{{ item.meta.title }}</span>
        <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import usePermissionStore from '@/store/modules/permission'
import type { RouteLocationMatched } from 'vue-router'

interface BreadcrumbItem {
  path: string
  name?: string | symbol
  redirect?: string
  meta?: Record<string, unknown>
  children?: BreadcrumbItem[]
}

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()
const levelList = ref<BreadcrumbItem[]>([])

function getBreadcrumb(): void {
  // only show routes with meta.title
  let matched: BreadcrumbItem[] = []
  const pathNum = findPathNum(route.path)
  // multi-level menu
  if (pathNum > 2) {
    const reg = /\/\w+/gi
    const pathList = route.path.match(reg)?.map((item: string, index: number) => {
      if (index !== 0) item = item.slice(1)
      return item
    }) || []
    getMatched(pathList, permissionStore.defaultRoutes as BreadcrumbItem[], matched)
  } else {
    matched = route.matched.filter((item: RouteLocationMatched) => item.meta && item.meta.title) as unknown as BreadcrumbItem[]
  }
  // 鍒ゆ柇鏄惁涓洪椤?
  if (!isDashboard(matched[0])) {
    matched = [{ path: "/index", meta: { title: "棣栭〉" } }, ...matched]
  }
  levelList.value = matched.filter(item => item.meta && item.meta.title && (item.meta.breadcrumb as boolean) !== false)
}
function findPathNum(str: string, char = "/"): number {
  let index = str.indexOf(char)
  let num = 0
  while (index !== -1) {
    num++
    index = str.indexOf(char, index + 1)
  }
  return num
}
function getMatched(pathList: string[], routeList: BreadcrumbItem[], matched: BreadcrumbItem[]): void {
  let data = routeList.find((item: BreadcrumbItem) => item.path == pathList[0] || String(item.name || '').toLowerCase() == pathList[0])
  if (data) {
    matched.push(data)
    if (data.children && pathList.length) {
      pathList.shift()
      getMatched(pathList, data.children, matched)
    }
  }
}
function isDashboard(route?: BreadcrumbItem): boolean {
  const name = route && route.name
  if (!name) {
    return false
  }
  return String(name).trim() === 'Index'
}
function handleLink(item: BreadcrumbItem): void {
  const { redirect, path } = item
  if (redirect) {
    router.push(redirect as string)
    return
  }
  router.push(path)
}

watchEffect(() => {
  // if you go to the redirect page, do not update the breadcrumbs
  if (route.path.startsWith('/redirect/')) {
    return
  }
  getBreadcrumb()
})
getBreadcrumb()
</script>

<style lang='scss' scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;

  .no-redirect {
    color: #97a8be;
    cursor: text;
  }
}
</style>



