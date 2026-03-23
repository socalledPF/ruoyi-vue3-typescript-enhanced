import type { TableColumnCtx, TableInstance, TableProps } from "element-plus";
type DefaultRow = Record<PropertyKey, any>;

type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | Function;

type StringKeyOf<T> = Extract<keyof T, string>;
type NonArrayObject<T> = T extends readonly unknown[]
  ? never
  : T extends Primitive
    ? never
    : T extends object
      ? T
      : never;

type PathImpl<T, K extends StringKeyOf<T>> = NonArrayObject<T[K]> extends never
  ? `${K}`
  : `${K}` | `${K}.${ProTablePath<NonArrayObject<T[K]>>}`;

export type ProTablePath<T> = T extends object
  ? {
      [K in StringKeyOf<T>]-?: PathImpl<T, K>;
    }[StringKeyOf<T>]
  : never;

export type ProTablePathValue<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? ProTablePathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export interface ProTablePaginationPayload {
  page: number;
  limit: number;
}

export interface ProTablePaginationProps {
  total: number;
  page?: number;
  limit?: number;
  pageSizes?: number[];
  pagerCount?: number;
  layout?: string;
  background?: boolean;
  autoScroll?: boolean;
  hidden?: boolean;
}

export interface ProTableColumn<
  T extends DefaultRow,
  P extends ProTablePath<T> | undefined = ProTablePath<T> | undefined,
> {
  type?: string;
  label?: string;
  className?: string;
  labelClassName?: string;
  property?: P;
  prop?: P;
  width?: string | number;
  minWidth?: string | number;
  renderHeader?: (data: {
    column: TableColumnCtx<T>;
    $index: number;
    store: unknown;
    _self: unknown;
  }) => VNode;
  sortable?: boolean | string;
  sortMethod?: (a: T, b: T) => number;
  sortBy?: string | string[] | ((row: T, index: number, array?: T[]) => string);
  resizable?: boolean;
  columnKey?: string;
  align?: string;
  headerAlign?: string;
  showOverflowTooltip?: boolean | object;
  tooltipFormatter?: TableColumnCtx<T>["tooltipFormatter"];
  fixed?: boolean | string;
  formatter?: (
    row: T,
    column: TableColumnCtx<T>,
    cellValue: P extends ProTablePath<T> ? ProTablePathValue<T, P> : unknown,
    index: number,
  ) => VNode | string;
  selectable?: (row: T, index: number) => boolean;
  reserveSelection?: boolean;
  filterMethod?: (value: string, row: T, column: TableColumnCtx<T>) => void;
  filteredValue?: string[];
  filters?: Array<{ text: string; value: string }>;
  filterPlacement?: string;
  filterMultiple?: boolean;
  filterClassName?: string;
  index?: number | ((index: number) => number);
  sortOrders?: Array<"ascending" | "descending" | null>;
  children?: ProTableColumn<T>[];
  visible?: boolean;
  slot?: string;
  headerSlot?: string;
}

export interface ProTableCellSlotProps<
  T extends DefaultRow,
  P extends ProTablePath<T> | undefined = ProTablePath<T> | undefined,
> {
  row: T;
  $index: number;
  column: ProTableColumn<T, P>;
  tableColumn: TableColumnCtx<T>;
  value: P extends ProTablePath<T> ? ProTablePathValue<T, P> : unknown;
}

export interface ProTableHeaderSlotProps<
  T extends DefaultRow,
  P extends ProTablePath<T> | undefined = ProTablePath<T> | undefined,
> {
  $index: number;
  column: ProTableColumn<T, P>;
  tableColumn: TableColumnCtx<T>;
}

export type ProTableProps<T extends DefaultRow> = Omit<TableProps<T>, "data"> & {
  data: T[];
  column: ProTableColumn<T>[];
  pagination?: false | ProTablePaginationProps;
};

export type ProTableInstance = TableInstance & {
  setPage: (page: number) => void;
  setPageSize: (limit: number) => void;
  resetPagination: () => void;
  scrollToTop: () => void;
};
