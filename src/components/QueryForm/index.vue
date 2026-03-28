<template>
  <div class="query-form">
    <el-form
      ref="formRef"
      :model="model"
      class="query-form__form"
      :label-width="resolvedLabelWidth"
    >
      <el-row :gutter="12">
        <el-col
          v-for="item in visibleItems"
          :key="getItemKey(item)"
          :span="itemSpan"
        >
          <el-form-item :label="item.label" :prop="item.prop">
            <slot
              v-if="item.slot && $slots[item.slot]"
              :name="item.slot"
              :item="item"
              :model="model"
              :value="getModelValue(item)"
              :set-value="(value: unknown) => updateModelValue(item, value)"
            />
            <component
              v-else
              :is="item.component"
              v-bind="resolveComponentProps(item)"
              v-on="resolveComponentListeners(item)"
            >
              <template v-if="isSelectComponent(item)">
                <el-option
                  v-for="(option, index) in item.options || []"
                  :key="`${getItemKey(item)}-${index}`"
                  :label="getOptionLabel(item, option)"
                  :value="getOptionValue(item, option)"
                  :disabled="getOptionDisabled(item, option)"
                />
              </template>
            </component>
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <div class="query-form__actions">
            <div class="query-form__buttons">
              <slot name="actions-prefix" :model="model" />
              <el-button type="primary" icon="Search" @click="query">
                {{ queryTextLocal }}
              </el-button>
              <el-button icon="Refresh" @click="reset">
                {{ resetTextLocal }}
              </el-button>
              <slot name="actions" :model="model" />
            </div>
            <div class="query-form__expand">
              <el-button
                v-if="showExpandToggle"
                link
                type="primary"
                @click="toggleExpand()"
              >
                {{ isExpanded ? "收起" : "展开" }}
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { useWindowSize } from "@vueuse/core";
import type { FormInstance } from "element-plus";

import type {
  QueryFormColumns,
  QueryFormItem,
  QueryFormOption,
  QueryFormProps,
  QueryFormInstance,
} from "@/types/queryForm";

defineOptions({
  name: "QueryForm",
});

const DEFAULT_COLUMNS: Required<QueryFormColumns> = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
};

const CLEARABLE_COMPONENTS = new Set([
  "el-input",
  "el-select",
  "el-date-picker",
  "el-time-picker",
  "el-cascader",
  "el-tree-select",
  "el-autocomplete",
  "el-mention",
]);

const props = withDefaults(defineProps<QueryFormProps>(), {
  columns: () => ({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
  }),
  maxVisibleRows: 1,
  autoClearable: true,
  queryText: "搜索",
  resetText: "重置",
});

const emit = defineEmits<{
  query: [model: Record<string, unknown>];
  reset: [model: Record<string, unknown>];
  "expand-change": [expanded: boolean];
}>();

const formRef = ref<FormInstance>();
const isExpanded = ref(false);
const initialSnapshot = ref<Record<string, unknown>>(cloneModel(props.model));
const { width } = useWindowSize();

const queryTextLocal = computed(() => props.queryText || "搜索");
const resetTextLocal = computed(() => props.resetText || "重置");

const resolvedLabelWidth = computed(() => {
  if (typeof props.labelWidth === "number") {
    return `${props.labelWidth}px`;
  }
  if (typeof props.labelWidth === "string" && props.labelWidth.trim() !== "") {
    return props.labelWidth;
  }
  return "68px";
});

const columnsConfig = computed<Required<QueryFormColumns>>(() => ({
  ...DEFAULT_COLUMNS,
  ...(props.columns || {}),
}));

const activeColumns = computed(() => {
  const viewportWidth = width.value;
  const columns = columnsConfig.value;

  if (viewportWidth < 768) return columns.xs;
  if (viewportWidth < 992) return columns.sm;
  if (viewportWidth < 1200) return columns.md;
  if (viewportWidth < 1920) return columns.lg;
  return columns.xl;
});

const itemSpan = computed(() =>
  Math.max(1, Math.floor(24 / activeColumns.value)),
);

const visibleItemsRaw = computed(() =>
  props.items.filter((item: QueryFormItem) => {
    if (typeof item.visible === "function") {
      return item.visible(props.model);
    }
    if (typeof item.visible === "boolean") {
      return item.visible;
    }
    return true;
  }),
);

const collapsedVisibleCount = computed(
  () => Math.max(1, props.maxVisibleRows) * activeColumns.value,
);

const showExpandToggle = computed(
  () => visibleItemsRaw.value.length > collapsedVisibleCount.value,
);

const visibleItems = computed(() => {
  if (isExpanded.value || !showExpandToggle.value) {
    return visibleItemsRaw.value;
  }
  return visibleItemsRaw.value.slice(0, collapsedVisibleCount.value);
});

watch(showExpandToggle, (visible: boolean) => {
  if (!visible && isExpanded.value) {
    isExpanded.value = false;
    emit("expand-change", false);
  }
});

function cloneModel<T>(value: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch (_error) {
      // Vue reactive proxies are not always structured-cloneable.
      // Fall through to JSON clone for query models.
    }
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch (_error) {
    return value;
  }
}

function overwriteModel(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): void {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });
  Object.assign(target, cloneModel(source));
}

function getItemKey(item: QueryFormItem): string | number {
  return item.key ?? item.prop;
}

function getByPath(source: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((result, key) => {
    if (result == null || typeof result !== "object") {
      return undefined;
    }
    return (result as Record<string, unknown>)[key];
  }, source);
}

function setByPath(
  source: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  if (!path) return;
  const keys = path.split(".");
  const lastKey = keys.pop();
  if (!lastKey) return;

  let current: Record<string, unknown> = source;
  keys.forEach((key) => {
    const currentValue = current[key];
    if (currentValue == null || typeof currentValue !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  });
  current[lastKey] = value;
}

function getModelValue(item: QueryFormItem): unknown {
  return getByPath(props.model, item.prop);
}

function updateModelValue(item: QueryFormItem, value: unknown): void {
  setByPath(props.model, item.prop, value);
}

function shouldInjectClearable(
  item: QueryFormItem,
  componentProps: Record<string, unknown>,
): boolean {
  if (!props.autoClearable) return false;
  if (typeof item.component !== "string") return false;
  if (!CLEARABLE_COMPONENTS.has(item.component.toLowerCase())) return false;
  if (Object.prototype.hasOwnProperty.call(componentProps, "clearable"))
    return false;
  return true;
}

function resolveRawComponentProps(
  item: QueryFormItem,
): Record<string, unknown> {
  if (typeof item.componentProps === "function") {
    return item.componentProps(props.model);
  }
  return item.componentProps || {};
}

function resolveComponentProps(item: QueryFormItem): Record<string, unknown> {
  const rawProps = resolveRawComponentProps(item);
  const modelProp = item.modelProp || "modelValue";
  const componentProps: Record<string, unknown> = {
    ...rawProps,
    [modelProp]: getModelValue(item),
  };

  if (shouldInjectClearable(item, componentProps)) {
    componentProps.clearable = true;
  }

  if (!Object.prototype.hasOwnProperty.call(componentProps, "style")) {
    componentProps.style = "width: 100%";
  }

  return componentProps;
}

function resolveComponentListeners(
  item: QueryFormItem,
): Record<string, unknown> {
  const listeners: Record<string, unknown> = {};
  const modelEvent = item.modelEvent || "update:modelValue";

  listeners[modelEvent] = (value: unknown) => {
    updateModelValue(item, value);
  };

  if (
    typeof item.component === "string" &&
    item.component.toLowerCase() === "el-input"
  ) {
    listeners.keyup = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        query();
      }
    };
  }

  return listeners;
}

function isSelectComponent(item: QueryFormItem): boolean {
  return (
    typeof item.component === "string" &&
    item.component.toLowerCase() === "el-select"
  );
}

function getOptionPropKey(
  item: QueryFormItem,
  key: keyof Required<NonNullable<QueryFormItem["optionProps"]>>,
): string {
  const defaults = {
    label: "label",
    value: "value",
    disabled: "disabled",
  };
  return item.optionProps?.[key] || defaults[key];
}

function getOptionLabel(item: QueryFormItem, option: QueryFormOption): string {
  const labelKey = getOptionPropKey(item, "label");
  const value = option[labelKey];
  return value == null ? "" : String(value);
}

function getOptionValue(item: QueryFormItem, option: QueryFormOption): unknown {
  const valueKey = getOptionPropKey(item, "value");
  return option[valueKey];
}

function getOptionDisabled(
  item: QueryFormItem,
  option: QueryFormOption,
): boolean {
  const disabledKey = getOptionPropKey(item, "disabled");
  return Boolean(option[disabledKey]);
}

function query(): void {
  emit("query", cloneModel(props.model));
}

function reset(): void {
  overwriteModel(props.model, initialSnapshot.value);
  formRef.value?.clearValidate();
  isExpanded.value = false;
  emit("expand-change", false);
  emit("reset", cloneModel(props.model));
  emit("query", cloneModel(props.model));
}

function toggleExpand(expanded?: boolean): void {
  const nextExpanded =
    typeof expanded === "boolean" ? expanded : !isExpanded.value;
  isExpanded.value = nextExpanded;
  emit("expand-change", nextExpanded);
}

defineExpose<QueryFormInstance>({
  query,
  reset,
  toggleExpand,
});
</script>

<style scoped lang="scss">
.query-form {
  .query-form__form {
    :deep(.el-form-item) {
      margin-bottom: 12px;
    }
  }
}

.query-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 2px;
  flex-wrap: nowrap;
}

.query-form__expand {
  flex: none;
  white-space: nowrap;
}

.query-form__buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
</style>
