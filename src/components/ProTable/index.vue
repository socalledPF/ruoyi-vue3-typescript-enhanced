<template>
  <div class="pro-table">
    <el-table ref="tableRef" v-bind="tableBindings">
      <ColumnRenderer
        v-for="(item, index) in visibleColumns"
        :key="getColumnKey(item, index)"
        :column="item"
        :index="index"
      >
        <template
          v-for="(_, slotName) in $slots"
          #[slotName]="slotScope"
        >
          <slot :name="slotName" v-bind="slotScope" />
        </template>
      </ColumnRenderer>
    </el-table>

    <Pagination
      v-if="paginationConfig"
      class="pro-table__pagination"
      :total="paginationConfig.total"
      :page="currentPage"
      :limit="pageSize"
      :page-sizes="paginationConfig.pageSizes"
      :pager-count="paginationConfig.pagerCount"
      :layout="paginationConfig.layout"
      :background="paginationConfig.background"
      :auto-scroll="paginationConfig.autoScroll"
      :hidden="paginationConfig.hidden"
      @update:page="handlePageUpdate"
      @update:limit="handleLimitUpdate"
      @pagination="handlePagination"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from "element-plus";

import Pagination from "@/components/Pagination/index.vue";
import type {
  ProTableColumn,
  ProTableInstance,
  ProTablePaginationPayload,
  ProTablePaginationProps,
  ProTableProps,
} from "@/types/proTable";

import ColumnRenderer from "./ColumnRenderer";

defineOptions({
  name: "ProTable",
  inheritAttrs: false,
});

type TableRow = Record<string, unknown>;

const props = withDefaults(defineProps<ProTableProps<TableRow>>(), {
  data: () => [],
  column: () => [],
});

const emit = defineEmits<{
  "update:page": [page: number];
  "update:limit": [limit: number];
  pagination: [payload: ProTablePaginationPayload];
}>();

const attrs = useAttrs();
const tableRef = ref<TableInstance>();
const innerPage = ref(1);
const innerLimit = ref(20);

const tableBindings = computed(() => {
  const { column, pagination, ...tableProps } = props;

  return {
    ...attrs,
    ...tableProps,
  };
});

const visibleColumns = computed(() =>
  props.column.filter((item: ProTableColumn<TableRow>) => item.visible !== false),
);

const paginationConfig = computed<ProTablePaginationProps | null>(() => {
  if (props.pagination === false || !props.pagination) {
    return null;
  }

  return props.pagination;
});

const currentPage = computed(() => paginationConfig.value?.page ?? innerPage.value);
const pageSize = computed(() => paginationConfig.value?.limit ?? innerLimit.value);

watch(
  () => props.pagination?.page,
  (value: number | undefined) => {
    if (typeof value === "number") {
      innerPage.value = value;
    }
  },
  { immediate: true },
);

watch(
  () => props.pagination?.limit,
  (value: number | undefined) => {
    if (typeof value === "number") {
      innerLimit.value = value;
    }
  },
  { immediate: true },
);

function getColumnKey(column: ProTableColumn<TableRow>, index: number): string | number {
  return (
    column.columnKey ??
    column.prop ??
    column.property ??
    column.type ??
    column.label ??
    index
  );
}

function syncPage(page: number): void {
  innerPage.value = page;
  emit("update:page", page);
}

function syncLimit(limit: number): void {
  innerLimit.value = limit;
  emit("update:limit", limit);
}

function getPageAfterLimitChange(limit: number): number {
  if (!paginationConfig.value) {
    return currentPage.value;
  }

  return currentPage.value * limit > paginationConfig.value.total ? 1 : currentPage.value;
}

function handlePageUpdate(page: number): void {
  syncPage(page);
}

function handleLimitUpdate(limit: number): void {
  syncLimit(limit);
}

function handlePagination(payload: ProTablePaginationPayload): void {
  emit("pagination", payload);
}

function scrollToTop(): void {
  tableRef.value?.setScrollTop(0);
}

function setPage(page: number): void {
  syncPage(page);
  emit("pagination", { page, limit: pageSize.value });
}

function setPageSize(limit: number): void {
  const nextPage = getPageAfterLimitChange(limit);

  syncLimit(limit);
  if (nextPage !== currentPage.value) {
    syncPage(nextPage);
  }

  emit("pagination", { page: nextPage, limit });
}

function resetPagination(): void {
  syncPage(1);
  emit("pagination", { page: 1, limit: pageSize.value });
}

function setCurrentRow(row?: TableRow): void {
  tableRef.value?.setCurrentRow(row);
}

function getSelectionRows(): TableRow[] {
  return tableRef.value?.getSelectionRows() ?? [];
}

function toggleRowSelection(
  row: TableRow,
  selected?: boolean,
  ignoreSelectable?: boolean,
): void {
  tableRef.value?.toggleRowSelection(row, selected, ignoreSelectable);
}

function clearSelection(): void {
  tableRef.value?.clearSelection();
}

function clearFilter(columnKeys?: string[] | string): void {
  tableRef.value?.clearFilter(columnKeys);
}

function toggleAllSelection(): void {
  tableRef.value?.toggleAllSelection();
}

function toggleRowExpansion(row: TableRow, expanded?: boolean): void {
  tableRef.value?.toggleRowExpansion(row, expanded);
}

function clearSort(): void {
  tableRef.value?.clearSort();
}

function doLayout(): void {
  tableRef.value?.doLayout();
}

function sort(prop: string, order: string): void {
  tableRef.value?.sort(prop, order);
}

function scrollTo(options: ScrollToOptions | number, yCoord?: number): void {
  tableRef.value?.scrollTo(options, yCoord);
}

function setScrollLeft(left?: number): void {
  tableRef.value?.setScrollLeft(left);
}

function setScrollTop(top?: number): void {
  tableRef.value?.setScrollTop(top);
}

defineExpose<ProTableInstance>({
  setCurrentRow,
  getSelectionRows,
  toggleRowSelection,
  clearSelection,
  clearFilter,
  toggleAllSelection,
  toggleRowExpansion,
  clearSort,
  doLayout,
  sort,
  scrollTo,
  setScrollLeft,
  setScrollTop,
  setPage,
  setPageSize,
  resetPagination,
  scrollToTop,
} as ProTableInstance);
</script>

<style scoped lang="scss">
.pro-table {
  min-width: 0;
}

.pro-table__pagination {
  transform-origin: top center;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
</style>
