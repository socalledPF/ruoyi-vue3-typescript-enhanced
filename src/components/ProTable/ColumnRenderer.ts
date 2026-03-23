import { ElTableColumn } from "element-plus";

import type {
  ProTableCellSlotProps,
  ProTableColumn,
  ProTableHeaderSlotProps,
} from "@/types/proTable";

type TableRow = Record<string, unknown>;

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

function getCellValue(row: TableRow, path?: string): unknown {
  if (!path) {
    return undefined;
  }

  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, row);
}

function getOverflowTooltip(column: ProTableColumn<TableRow>): boolean | object | undefined {
  if (column.showOverflowTooltip !== undefined) {
    return column.showOverflowTooltip;
  }

  if (column.children?.length) {
    return undefined;
  }

  if (column.type === "selection" || column.type === "index" || column.type === "expand") {
    return undefined;
  }

  return column.prop || column.property ? true : undefined;
}

const ColumnRenderer = defineComponent({
  name: "ProTableColumnRenderer",
  props: {
    column: {
      type: Object as PropType<ProTableColumn<TableRow>>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  setup(
    props: { column: ProTableColumn<TableRow>; index: number },
    { slots }: { slots: Record<string, ((scope: any) => any) | undefined> },
  ) {
    return () => {
      const { children, visible, slot, headerSlot, ...restColumn } = props.column;

      if (visible === false) {
        return null;
      }

      const columnProps = {
        ...restColumn,
        showOverflowTooltip: getOverflowTooltip(props.column),
      };

      const columnSlots: Record<string, ((scope: any) => any) | undefined> = {};
      const visibleChildren =
        children?.filter((item: ProTableColumn<TableRow>) => item.visible !== false) ??
        [];

      if (visibleChildren.length > 0) {
        columnSlots.default = () =>
          visibleChildren.map((child: ProTableColumn<TableRow>, childIndex: number) =>
            h(
              ColumnRenderer,
              {
                key: getColumnKey(child, childIndex),
                column: child,
                index: childIndex,
              },
              slots,
            ),
          );
      } else if (slot && slots[slot]) {
        columnSlots.default = (scope: {
          row: TableRow;
          $index: number;
          column: any;
        }) => {
          const slotProps: ProTableCellSlotProps<TableRow> = {
            row: scope.row,
            $index: scope.$index,
            column: props.column,
            tableColumn: scope.column,
            value: getCellValue(
              scope.row,
              String(props.column.prop ?? props.column.property ?? ""),
            ),
          };

          return slots[slot]?.(slotProps);
        };
      }

      if (headerSlot && slots[headerSlot]) {
        columnSlots.header = (scope: { $index: number; column: any }) => {
          const slotProps: ProTableHeaderSlotProps<TableRow> = {
            $index: scope.$index,
            column: props.column,
            tableColumn: scope.column,
          };

          return slots[headerSlot]?.(slotProps);
        };
      }

      return h(
        ElTableColumn,
        {
          key: getColumnKey(props.column, props.index),
          ...columnProps,
        },
        columnSlots,
      );
    };
  },
});

export default ColumnRenderer;
