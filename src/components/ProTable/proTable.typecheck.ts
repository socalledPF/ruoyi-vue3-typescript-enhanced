import type {
  ProTableCellSlotProps,
  ProTableColumn,
  ProTableHeaderSlotProps,
  ProTableInstance,
} from "@/types";

interface UserRow {
  userId: number;
  userName: string;
  status: "0" | "1";
  dept: {
    deptName: string;
  };
}

const columns: ProTableColumn<UserRow>[] = [
  {
    type: "selection",
    width: 55,
  },
  {
    label: "用户名",
    prop: "userName",
    sortable: true,
  },
  {
    label: "部门",
    prop: "dept.deptName",
    showOverflowTooltip: true,
  },
  {
    label: "状态",
    prop: "status",
    slot: "status",
    headerSlot: "status-header",
  },
];

const statusCellSlot: ProTableCellSlotProps<UserRow, "status"> = {
  row: {
    userId: 1,
    userName: "admin",
    status: "0",
    dept: {
      deptName: "研发部",
    },
  },
  $index: 0,
  column: columns[3] as ProTableColumn<UserRow, "status">,
  tableColumn: {} as never,
  value: "0",
};

const deptHeaderSlot: ProTableHeaderSlotProps<UserRow, "dept.deptName"> = {
  $index: 0,
  column: columns[2] as ProTableColumn<UserRow, "dept.deptName">,
  tableColumn: {} as never,
};

const tableRef = ref<ProTableInstance>();

tableRef.value?.sort("userName", "ascending");
tableRef.value?.toggleRowSelection(statusCellSlot.row, true);
tableRef.value?.clearSelection();
tableRef.value?.doLayout();
tableRef.value?.setPage(2);
tableRef.value?.setPageSize(50);
tableRef.value?.resetPagination();

void deptHeaderSlot;
