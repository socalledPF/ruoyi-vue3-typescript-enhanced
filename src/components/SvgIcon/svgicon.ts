import { App } from 'vue'
import * as components from '@element-plus/icons-vue'

export default {
  install: (app: App) => {
    const iconComponents = components as Record<string, { name: string }>
    for (const key in components) {
      const componentConfig = iconComponents[key]
      app.component(componentConfig.name, componentConfig)
    }
  }
}
