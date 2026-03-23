<template>
  <el-menu
    :default-active="activeMenu"
    mode="horizontal"
    @select="handleSelect"
    :ellipsis="false"
  >
    <template v-for="(item, index) in topMenus">
      <el-menu-item :style="{ '--theme': theme }" :index="item.path" :key="index" v-if="index < visibleNumber">
        <svg-icon
          v-if="item.meta && item.meta.icon && item.meta.icon !== '#'"
          :icon-class="item.meta.icon"
        />
        {{ item.meta?.title }}
      </el-menu-item>
    </template>

    <el-sub-menu :style="{ '--theme': theme }" index="more" v-if="topMenus.length > visibleNumber">
      <template #title>更多菜单</template>
      <template v-for="(item, index) in topMenus">
        <el-menu-item
          :index="item.path"
          :key="index"
          v-if="index >= visibleNumber"
        >
          <svg-icon
            v-if="item.meta && item.meta.icon && item.meta.icon !== '#'"
            :icon-class="item.meta.icon"
          />
          {{ item.meta?.title }}
        </el-menu-item>
      </template>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { constantRoutes } from "@/router"
import { isHttp } from '@/utils/validate'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import type { LocationQueryRaw, RouteLocationNormalizedLoaded } from 'vue-router'
import type { MetaVo, RouterVo } from '@/types'

interface TopMenuItem extends RouterVo {
  path: string
  meta?: MetaVo
  query?: string
  children?: TopMenuItem[]
  parentPath?: string
}

const visibleNumber = ref<number | null>(null)
const currentIndex = ref<string | null>(null)
const hideList = ['/index', '/user/profile']

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const route = useRoute()
const router = useRouter()

const theme = computed(() => settingsStore.theme)
const routers = computed<TopMenuItem[]>(() => permissionStore.topbarRouters as TopMenuItem[])

const topMenus = computed<TopMenuItem[]>(() => {
  const menuItems: TopMenuItem[] = []
  routers.value.forEach((menu: TopMenuItem) => {
    if (menu.hidden !== true) {
      if (menu.path === '/' && menu.children && menu.children.length > 0) {
        menuItems.push(menu.children[0])
      } else {
        menuItems.push(menu)
      }
    }
  })
  return menuItems
})

const childrenMenus = computed<TopMenuItem[]>(() => {
  const menuItems: TopMenuItem[] = []
  routers.value.forEach((parentRoute: TopMenuItem) => {
    const children = parentRoute.children ?? []
    children.forEach((childRoute: TopMenuItem) => {
      if (childRoute.parentPath === undefined) {
        if (parentRoute.path === '/') {
          childRoute.path = `/${childRoute.path}`
        } else if (!isHttp(childRoute.path)) {
          childRoute.path = `${parentRoute.path}/${childRoute.path}`
        }
        childRoute.parentPath = parentRoute.path
      }
      menuItems.push(childRoute)
    })
  })
  return [...(constantRoutes as unknown as TopMenuItem[]), ...menuItems]
})

const activeMenu = computed(() => {
  const path = route.path
  let activePath = path
  if (path !== undefined && path.lastIndexOf("/") > 0 && hideList.indexOf(path) === -1) {
    const tmpPath = path.substring(1, path.length)
    if (!route.meta.link) {
      activePath = "/" + tmpPath.substring(0, tmpPath.indexOf("/"))
      appStore.toggleSideBarHide(false)
    }
  } else if (!((route as RouteLocationNormalizedLoaded & { children?: TopMenuItem[] }).children)) {
    activePath = path
    appStore.toggleSideBarHide(true)
  }
  activeRoutes(activePath)
  return activePath
})

function setVisibleNumber(): void {
  const width = document.body.getBoundingClientRect().width / 3
  visibleNumber.value = Math.max(1, parseInt(String(width / 85)))
}

function handleSelect(key: string, keyPath: string[]): void {
  void keyPath
  currentIndex.value = key
  const matchedRoute = routers.value.find((item: TopMenuItem) => item.path === key)
  if (isHttp(key)) {
    window.open(key, "_blank")
  } else if (!matchedRoute || !matchedRoute.children) {
    const routeMenu = childrenMenus.value.find((item: TopMenuItem) => item.path === key)
    if (routeMenu && typeof routeMenu.query === "string" && routeMenu.query.length > 0) {
      const query = JSON.parse(routeMenu.query) as LocationQueryRaw
      router.push({ path: key, query })
    } else {
      router.push({ path: key })
    }
    appStore.toggleSideBarHide(true)
  } else {
    activeRoutes(key)
    appStore.toggleSideBarHide(false)
  }
}

function activeRoutes(key: string): TopMenuItem[] {
  const routes: TopMenuItem[] = []
  if (childrenMenus.value.length > 0) {
    childrenMenus.value.forEach((item: TopMenuItem) => {
      if (key === item.parentPath || (key === "index" && item.path === "")) {
        routes.push(item)
      }
    })
  }
  if (routes.length > 0) {
    permissionStore.setSidebarRouters(routes)
  } else {
    appStore.toggleSideBarHide(true)
  }
  return routes
}

onMounted(() => {
  window.addEventListener('resize', setVisibleNumber)
  setVisibleNumber()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', setVisibleNumber)
})
</script>

<style lang="scss">
.topmenu-container.el-menu--horizontal > .el-menu-item {
  float: left;
  height: 50px !important;
  line-height: 50px !important;
  color: #303133 !important;
  padding: 0 5px !important;
  margin: 0 10px !important;
}

.topmenu-container.el-menu--horizontal > .el-menu-item.is-active, .el-menu--horizontal > .el-sub-menu.is-active .el-submenu__title {
  border-bottom: 2px solid #{'var(--theme)'} !important;
  color: #303133;
}

.topmenu-container.el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
  float: left;
  height: 50px !important;
  line-height: 50px !important;
  color: #303133 !important;
  padding: 0 5px !important;
  margin: 0 10px !important;
}

.topmenu-container.el-menu--horizontal > .el-menu-item:not(.is-disabled):focus,
.topmenu-container.el-menu--horizontal > .el-menu-item:not(.is-disabled):hover,
.topmenu-container.el-menu--horizontal > .el-submenu .el-submenu__title:hover {
  background-color: #ffffff;
}

.topmenu-container .svg-icon {
  margin-right: 4px;
}

.topmenu-container .el-sub-menu .el-sub-menu__icon-arrow {
  position: static;
  vertical-align: middle;
  margin-left: 8px;
  margin-top: 0;
}
</style>
