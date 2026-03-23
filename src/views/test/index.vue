<template>
  <div class="app-container protable-demo">
    <section class="demo-lead">
      <div class="demo-lead__copy">
        <p class="demo-eyebrow">ProTable Showcase</p>
        <h1>One table surface, typed deeply, slotted aggressively.</h1>
        <p class="demo-intro">
          This page stresses the wrapper instead of pretending it is a toy. It
          uses nested column config, dotted props, named header and cell slots,
          built-in pagination, summary rows, filters, selection, expansion, and
          exposed table methods from the parent ref.
        </p>
      </div>
      <div class="demo-lead__stats">
        <div>
          <span class="demo-stat__label">Visible rows</span>
          <strong>{{ filteredRows.length }}</strong>
        </div>
        <div>
          <span class="demo-stat__label">Selected</span>
          <strong>{{ selectedRows.length }}</strong>
        </div>
        <div>
          <span class="demo-stat__label">Current row</span>
          <strong>{{ currentWorkspace }}</strong>
        </div>
      </div>
    </section>

    <section class="demo-toolbar">
      <div class="demo-toolbar__filters">
        <el-input
          v-model="search"
          clearable
          placeholder="Search workspace, owner, or department"
        />
        <el-select v-model="statusFilter" style="width: 180px">
          <el-option label="All states" value="All" />
          <el-option label="Live" value="Live" />
          <el-option label="Watch" value="Watch" />
          <el-option label="Draft" value="Draft" />
        </el-select>
        <el-switch
          v-model="highRiskOnly"
          active-text="Critical only"
          inactive-text="All risk"
        />
        <el-switch
          v-model="showBudget"
          active-text="Budget column"
          inactive-text="Hide budget"
        />
        <el-switch
          v-model="showReview"
          active-text="Review date"
          inactive-text="Hide review"
        />
        <el-switch
          v-model="striped"
          active-text="Striped"
          inactive-text="Flat"
        />
      </div>

      <div class="demo-toolbar__actions">
        <el-button type="primary" @click="sortByHealth">Sort Health</el-button>
        <el-button @click="clearSortOrder">Clear Sort</el-button>
        <el-button @click="toggleAllVisibleRows">Toggle All</el-button>
        <el-button @click="clearSelectedRows">Clear Selection</el-button>
        <el-button @click="goToNextPage">Next Page</el-button>
        <el-button @click="scrollTableToTop">Scroll Top</el-button>
        <el-button type="danger" plain @click="resetDemo">Reset Demo</el-button>
      </div>

      <div class="demo-toolbar__meta">
        <span>Pagination {{ pagination.page }} / {{ maxPage }}</span>
        <span>Last event: {{ lastEvent }}</span>
      </div>
    </section>

    <section class="demo-surface">
      <div class="demo-surface__header">
        <div>
          <h2>Portfolio delivery matrix</h2>
          <p>
            Native Element Plus events flow through the proxy unchanged, while
            pagination stays inside the same surface.
          </p>
        </div>
        <div class="demo-surface__legend">
          <span><i class="dot dot--live"></i>Live</span>
          <span><i class="dot dot--watch"></i>Watch</span>
          <span><i class="dot dot--draft"></i>Draft</span>
        </div>
      </div>

      <ProTable
        ref="proTableRef"
        :data="pagedRows"
        :column="columns"
        :pagination="pagination"
        row-key="id"
        border
        highlight-current-row
        :stripe="striped"
        table-layout="auto"
        max-height="560"
        show-summary
        empty-text="No workspaces matched the current filters."
        :summary-method="getSummary"
        :default-sort="{ prop: 'healthScore', order: 'descending' }"
        :row-class-name="getRowClassName"
        @update:page="pagination.page = $event"
        @update:limit="pagination.limit = $event"
        @pagination="handlePagination"
        @selection-change="handleSelectionChange"
        @current-change="handleCurrentChange"
        @sort-change="handleSortChange"
        @row-click="handleRowClick"
      >
        <template #expandDetail="{ row }">
          <div class="expand-panel">
            <div>
              <p class="expand-panel__eyebrow">Narrative</p>
              <p class="expand-panel__text">{{ row.narrative }}</p>
            </div>
            <div class="expand-panel__updates">
              <div
                v-for="update in row.updates"
                :key="`${row.id}-${update.time}-${update.actor}`"
                class="update-line"
              >
                <strong>{{ update.title }}</strong>
                <span>{{ update.note }}</span>
                <em>{{ update.actor }} · {{ update.time }}</em>
              </div>
            </div>
          </div>
        </template>

        <template #ownerCell="{ row, value }">
          <div class="owner-cell">
            <strong>{{ value }}</strong>
            <span>{{ row.owner.squad }} squad</span>
          </div>
        </template>

        <template #statusHeader>
          <div class="stacked-header">
            <strong>Ship State</strong>
            <span>Slot-rendered header</span>
          </div>
        </template>

        <template #statusCell="{ row }">
          <div class="status-cell" :class="`status-cell--${row.status.toLowerCase()}`">
            <i class="dot" :class="`dot--${row.status.toLowerCase()}`"></i>
            <span>{{ row.status }}</span>
          </div>
        </template>

        <template #riskCell="{ row }">
          <el-tag
            :type="riskTagType[row.riskLevel]"
            effect="light"
            round
          >
            {{ row.riskLevel }}
          </el-tag>
        </template>

        <template #metricsHeader>
          <div class="stacked-header">
            <strong>Execution Rhythm</strong>
            <span>Grouped config columns</span>
          </div>
        </template>

        <template #healthCell="{ row }">
          <div class="meter-cell">
            <span>{{ row.healthScore }}%</span>
            <div class="meter-track">
              <div
                class="meter-fill"
                :style="{ width: `${row.healthScore}%` }"
              ></div>
            </div>
          </div>
        </template>

        <template #coverageCell="{ row }">
          <div class="coverage-cell">
            <strong>{{ row.automationCoverage }}%</strong>
            <span>{{ row.automationCoverage >= 75 ? "Auto-heavy" : "Manual mix" }}</span>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="actions-cell">
            <el-button link type="primary" @click.stop="focusRow(row)">
              Focus
            </el-button>
            <el-button link type="primary" @click.stop="selectRow(row)">
              Select
            </el-button>
          </div>
        </template>
      </ProTable>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Sort, SummaryMethod, TableColumnCtx } from "element-plus";

import type {
  ProTableColumn,
  ProTableInstance,
  ProTablePaginationPayload,
  ProTablePaginationProps,
} from "@/types";

interface DemoUpdate {
  title: string;
  actor: string;
  time: string;
  note: string;
}

interface DemoRow {
  id: number;
  workspaceName: string;
  dept: {
    name: string;
  };
  owner: {
    name: string;
    squad: string;
  };
  status: "Live" | "Watch" | "Draft";
  riskLevel: "Calm" | "Elevated" | "Critical";
  velocity: number;
  healthScore: number;
  budget: number;
  automationCoverage: number;
  updatedAt: string;
  nextReview: string;
  narrative: string;
  updates: DemoUpdate[];
}

const { proxy } = getCurrentInstance();

const proTableRef = ref<ProTableInstance>();
const search = ref("");
const statusFilter = ref<DemoRow["status"] | "All">("All");
const highRiskOnly = ref(false);
const showBudget = ref(true);
const showReview = ref(true);
const striped = ref(true);
const selectedRows = ref<DemoRow[]>([]);
const currentRowId = ref<number | null>(null);
const lastEvent = ref("Ready");

const riskTagType: Record<DemoRow["riskLevel"], "" | "warning" | "danger"> = {
  Calm: "",
  Elevated: "warning",
  Critical: "danger",
};

const pagination = reactive<ProTablePaginationProps>({
  total: 0,
  page: 1,
  limit: 6,
  pageSizes: [6, 8, 12],
  layout: "total, sizes, prev, pager, next, jumper",
  autoScroll: false,
});

const rows = ref<DemoRow[]>(createRows());

const filteredRows = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return rows.value.filter((row: DemoRow) => {
    const matchesKeyword =
      keyword === "" ||
      row.workspaceName.toLowerCase().includes(keyword) ||
      row.owner.name.toLowerCase().includes(keyword) ||
      row.dept.name.toLowerCase().includes(keyword);
    const matchesStatus =
      statusFilter.value === "All" || row.status === statusFilter.value;
    const matchesRisk = !highRiskOnly.value || row.riskLevel === "Critical";

    return matchesKeyword && matchesStatus && matchesRisk;
  });
});

const pagedRows = computed(() => {
  const start = ((pagination.page ?? 1) - 1) * (pagination.limit ?? 6);
  const end = start + (pagination.limit ?? 6);

  return filteredRows.value.slice(start, end);
});

const maxPage = computed(() =>
  Math.max(1, Math.ceil((pagination.total || 1) / (pagination.limit || 1))),
);

const currentWorkspace = computed(() => {
  const current = rows.value.find((row: DemoRow) => row.id === currentRowId.value);
  return current?.workspaceName ?? "None";
});

const columns = computed<ProTableColumn<DemoRow>[]>(() => [
  {
    type: "selection",
    width: 52,
    reserveSelection: true,
  },
  {
    type: "index",
    label: "#",
    width: 56,
    align: "center",
  },
  {
    type: "expand",
    width: 52,
    slot: "expandDetail",
  },
  {
    label: "Workspace",
    prop: "workspaceName",
    minWidth: 220,
    sortable: true,
  },
  {
    label: "Owner",
    prop: "owner.name",
    minWidth: 160,
    sortable: true,
    slot: "ownerCell",
  },
  {
    label: "Department",
    prop: "dept.name",
    minWidth: 140,
    sortable: true,
  },
  {
    label: "Status",
    prop: "status",
    minWidth: 130,
    sortable: true,
    slot: "statusCell",
    headerSlot: "statusHeader",
  },
  {
    label: "Risk",
    prop: "riskLevel",
    minWidth: 130,
    slot: "riskCell",
    filters: [
      { text: "Critical", value: "Critical" },
      { text: "Elevated", value: "Elevated" },
      { text: "Calm", value: "Calm" },
    ],
    filterMethod: (value: string, row: DemoRow) => row.riskLevel === value,
  },
  {
    label: "Execution Metrics",
    headerSlot: "metricsHeader",
    children: [
      {
        label: "Velocity",
        prop: "velocity",
        minWidth: 110,
        align: "right",
        sortable: true,
      },
      {
        label: "Health",
        prop: "healthScore",
        minWidth: 160,
        sortable: true,
        slot: "healthCell",
      },
      {
        label: "Budget",
        prop: "budget",
        minWidth: 120,
        align: "right",
        sortable: true,
        visible: showBudget.value,
        formatter: (
          _row: DemoRow,
          _column: TableColumnCtx<DemoRow>,
          value: number,
        ) => `$${Number(value).toLocaleString()}`,
      },
    ],
  },
  {
    label: "Dates",
    children: [
      {
        label: "Updated",
        prop: "updatedAt",
        minWidth: 132,
        sortable: true,
      },
      {
        label: "Next Review",
        prop: "nextReview",
        minWidth: 132,
        visible: showReview.value,
      },
    ],
  },
  {
    label: "Automation",
    prop: "automationCoverage",
    minWidth: 140,
    sortable: true,
    slot: "coverageCell",
  },
  {
    label: "Actions",
    width: 120,
    align: "center",
    slot: "actions",
  },
]);

watch(
  () => filteredRows.value.length,
  (total: number) => {
    pagination.total = total;
    if ((pagination.page ?? 1) > maxPage.value) {
      pagination.page = maxPage.value;
    }
  },
  { immediate: true },
);

watch(
  [search, statusFilter, highRiskOnly],
  () => {
    proTableRef.value?.resetPagination();
  },
  { flush: "post" },
);

function createRows(): DemoRow[] {
  const workspaces = [
    "Northstar Growth Console",
    "Mercury Ops Dashboard",
    "Atlas Revenue Board",
    "Helix Delivery Studio",
    "Signal Retention Grid",
    "Orbit Renewal Engine",
    "Harbor Launch Tracker",
    "Beacon Expansion Desk",
    "Vector Success Matrix",
    "Prism Demand Monitor",
    "Summit Partner Console",
    "Quartz Pipeline Ledger",
  ];
  const owners = [
    "Annie Case",
    "Leo Wang",
    "Mina Patel",
    "Noah Chen",
    "Riley Kim",
    "Sara Lin",
  ];
  const squads = ["Growth", "Core", "Platform", "Signals", "Finance", "Ops"];
  const departments = ["Commercial", "Operations", "Platform", "Lifecycle"];
  const statuses: DemoRow["status"][] = ["Live", "Watch", "Draft"];
  const risks: DemoRow["riskLevel"][] = ["Calm", "Elevated", "Critical"];

  return workspaces.map((workspaceName, index) => {
    const velocity = 17 + ((index * 3) % 15);
    const healthScore = 58 + ((index * 7) % 37);
    const budget = 180000 + index * 27000;
    const automationCoverage = 42 + ((index * 9) % 49);
    const status = statuses[index % statuses.length];
    const riskLevel =
      healthScore < 68 ? "Critical" : risks[(index + 1) % risks.length];

    return {
      id: index + 1,
      workspaceName,
      dept: {
        name: departments[index % departments.length],
      },
      owner: {
        name: owners[index % owners.length],
        squad: squads[index % squads.length],
      },
      status,
      riskLevel,
      velocity,
      healthScore,
      budget,
      automationCoverage,
      updatedAt: `2026-03-${String(10 + index).padStart(2, "0")}`,
      nextReview: `2026-04-${String(3 + index).padStart(2, "0")}`,
      narrative:
        "This workspace mixes long-running delivery tracks with weekly operator review. The expand slot is intentionally content-heavy to prove that ProTable can host rich detail panes without leaving config-driven columns.",
      updates: [
        {
          title: "Sprint recalibrated",
          actor: owners[index % owners.length],
          time: "09:10",
          note: "Priority was shifted toward churn prevention and data refresh latency.",
        },
        {
          title: "Health review closed",
          actor: "PMO",
          time: "13:45",
          note: "No blockers remain on API dependency handoff after the latest sync.",
        },
        {
          title: "Automation pass",
          actor: "QA Bot",
          time: "18:20",
          note: "Regression coverage was re-run on critical user journeys.",
        },
      ],
    };
  });
}

const getSummary: SummaryMethod<DemoRow> = ({
  columns,
  data,
}: {
  columns: TableColumnCtx<DemoRow>[];
  data: DemoRow[];
}) => {
  if (!data.length) {
    return columns.map((_, index) => (index === 0 ? "Summary" : ""));
  }

  const average = (values: number[]) =>
    Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const totalBudget = data.reduce((sum, row) => sum + row.budget, 0);

  return columns.map((column, index) => {
    if (index === 0) {
      return "Summary";
    }

    switch (column.property) {
      case "velocity":
        return `${average(data.map((row) => row.velocity))} pts`;
      case "healthScore":
        return `${average(data.map((row) => row.healthScore))}%`;
      case "budget":
        return `$${totalBudget.toLocaleString()}`;
      case "automationCoverage":
        return `${average(data.map((row) => row.automationCoverage))}%`;
      default:
        return "";
    }
  });
};

function getRowClassName({
  row,
}: {
  row: DemoRow;
  rowIndex: number;
}): string {
  return row.riskLevel === "Critical" ? "protable-demo__row--critical" : "";
}

function handlePagination(payload: ProTablePaginationPayload): void {
  pagination.page = payload.page;
  pagination.limit = payload.limit;
  lastEvent.value = `Pagination -> page ${payload.page}, size ${payload.limit}`;
}

function handleSelectionChange(selection: DemoRow[]): void {
  selectedRows.value = selection;
  lastEvent.value = `Selection changed -> ${selection.length} rows`;
}

function handleCurrentChange(row?: DemoRow): void {
  currentRowId.value = row?.id ?? null;
  lastEvent.value = row
    ? `Current row -> ${row.workspaceName}`
    : "Current row cleared";
}

function handleSortChange(sort: Sort): void {
  const order = sort.order ?? "none";
  lastEvent.value = `Sort -> ${sort.prop || "manual"} (${order})`;
}

function handleRowClick(row: DemoRow): void {
  currentRowId.value = row.id;
}

function focusRow(row: DemoRow): void {
  currentRowId.value = row.id;
  proTableRef.value?.setCurrentRow(row);
  proxy.$modal.msgSuccess(`Focused ${row.workspaceName}`);
}

function selectRow(row: DemoRow): void {
  proTableRef.value?.toggleRowSelection(row, true);
}

function sortByHealth(): void {
  proTableRef.value?.sort("healthScore", "descending");
}

function clearSortOrder(): void {
  proTableRef.value?.clearSort();
}

function toggleAllVisibleRows(): void {
  proTableRef.value?.toggleAllSelection();
}

function clearSelectedRows(): void {
  proTableRef.value?.clearSelection();
}

function goToNextPage(): void {
  const nextPage = Math.min(maxPage.value, (pagination.page ?? 1) + 1);
  proTableRef.value?.setPage(nextPage);
}

function scrollTableToTop(): void {
  proTableRef.value?.scrollToTop();
}

function resetDemo(): void {
  search.value = "";
  statusFilter.value = "All";
  highRiskOnly.value = false;
  showBudget.value = true;
  showReview.value = true;
  striped.value = true;
  pagination.limit = 6;
  proTableRef.value?.clearSelection();
  proTableRef.value?.clearSort();
  proTableRef.value?.resetPagination();
  lastEvent.value = "Demo reset";
}
</script>

<style scoped lang="scss">
.protable-demo {
  --demo-ink: #12212b;
  --demo-subtle: #5b6b76;
  --demo-line: rgba(18, 33, 43, 0.12);
  --demo-panel: linear-gradient(180deg, #fffdf9 0%, #ffffff 100%);
  --demo-accent: #d4682f;
  --demo-accent-soft: rgba(212, 104, 47, 0.12);
  --demo-success: #1c8a63;
  --demo-warning: #d18c19;
  background:
    radial-gradient(circle at top right, rgba(212, 104, 47, 0.08), transparent 28%),
    linear-gradient(180deg, #f7f3ed 0%, #ffffff 28%);
  color: var(--demo-ink);
}

.demo-lead {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(260px, 1fr);
  gap: 24px;
  padding: 24px 28px;
  border: 1px solid var(--demo-line);
  background: var(--demo-panel);
}

.demo-eyebrow {
  margin: 0 0 10px;
  color: var(--demo-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.demo-lead h1 {
  margin: 0;
  max-width: 10ch;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.demo-intro {
  margin: 16px 0 0;
  max-width: 62ch;
  color: var(--demo-subtle);
  line-height: 1.7;
}

.demo-lead__stats {
  display: grid;
  gap: 18px;
  align-content: end;
  padding-top: 10px;
}

.demo-lead__stats div {
  padding-top: 14px;
  border-top: 1px solid var(--demo-line);
}

.demo-stat__label {
  display: block;
  margin-bottom: 8px;
  color: var(--demo-subtle);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.demo-lead__stats strong {
  font-size: 30px;
  line-height: 1;
}

.demo-toolbar,
.demo-surface {
  margin-top: 18px;
  border: 1px solid var(--demo-line);
  background: var(--demo-panel);
}

.demo-toolbar {
  display: grid;
  gap: 18px;
  padding: 20px 24px;
}

.demo-toolbar__filters,
.demo-toolbar__actions,
.demo-toolbar__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.demo-toolbar__meta {
  color: var(--demo-subtle);
  font-size: 13px;
}

.demo-surface__header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: end;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--demo-line);
}

.demo-surface__header h2 {
  margin: 0;
  font-size: 24px;
}

.demo-surface__header p {
  margin: 6px 0 0;
  color: var(--demo-subtle);
}

.demo-surface__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: var(--demo-subtle);
  font-size: 13px;
}

:deep(.pro-table) {
  padding: 0 24px 24px;
}

:deep(.pro-table__pagination) {
  margin-top: 16px;
}

:deep(.protable-demo__row--critical td) {
  background: rgba(209, 63, 35, 0.04);
}

.stacked-header {
  display: grid;
  gap: 2px;
}

.stacked-header span {
  color: var(--demo-subtle);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.owner-cell,
.coverage-cell {
  display: grid;
  gap: 2px;
}

.owner-cell span,
.coverage-cell span {
  color: var(--demo-subtle);
  font-size: 12px;
}

.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-cell--live {
  background: rgba(28, 138, 99, 0.1);
  color: var(--demo-success);
}

.status-cell--watch {
  background: rgba(209, 140, 25, 0.12);
  color: var(--demo-warning);
}

.status-cell--draft {
  background: rgba(91, 107, 118, 0.12);
  color: #43525c;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot--live {
  background: var(--demo-success);
}

.dot--watch {
  background: var(--demo-warning);
}

.dot--draft {
  background: #6d7b84;
}

.meter-cell {
  display: grid;
  gap: 6px;
}

.meter-cell span {
  font-size: 12px;
  font-weight: 600;
}

.meter-track {
  width: 100%;
  height: 6px;
  overflow: hidden;
  background: rgba(18, 33, 43, 0.08);
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--demo-accent) 0%, #f1b37f 100%);
}

.actions-cell {
  display: inline-flex;
  gap: 6px;
}

.expand-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 20px;
  padding: 8px 0;
}

.expand-panel__eyebrow {
  margin: 0 0 8px;
  color: var(--demo-subtle);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.expand-panel__text {
  margin: 0;
  color: var(--demo-ink);
  line-height: 1.7;
}

.expand-panel__updates {
  display: grid;
  gap: 10px;
}

.update-line {
  display: grid;
  gap: 3px;
  padding-left: 12px;
  border-left: 2px solid var(--demo-accent-soft);
}

.update-line span,
.update-line em {
  color: var(--demo-subtle);
  font-size: 12px;
}

@media (max-width: 992px) {
  .demo-lead,
  .expand-panel {
    grid-template-columns: 1fr;
  }

  .demo-surface__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
