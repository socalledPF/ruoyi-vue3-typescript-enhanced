type QueryFormModel = Record<string, unknown>;

type QueryFormComponentProps =
  | Record<string, unknown>
  | ((model: QueryFormModel) => Record<string, unknown>);

export interface QueryFormColumns {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface QueryFormOption {
  [key: string]: unknown;
}

export interface QueryFormOptionProps {
  label?: string;
  value?: string;
  disabled?: string;
}

export interface QueryFormItem {
  key?: string | number;
  prop: string;
  label?: string;
  component: string | Component;
  componentProps?: QueryFormComponentProps;
  visible?: boolean | ((model: QueryFormModel) => boolean);
  modelProp?: string;
  modelEvent?: string;
  slot?: string;
  options?: QueryFormOption[];
  optionProps?: QueryFormOptionProps;
}

export interface QueryFormProps {
  model: QueryFormModel;
  items: QueryFormItem[];
  columns?: QueryFormColumns;
  labelWidth?: string | number;
  maxVisibleRows?: number;
  autoClearable?: boolean;
  queryText?: string;
  resetText?: string;
}

export interface QueryFormSlotPayload {
  item: QueryFormItem;
  model: QueryFormModel;
  value: unknown;
  setValue: (value: unknown) => void;
}

export interface QueryFormInstance {
  query: () => void;
  reset: () => void;
  toggleExpand: (expanded?: boolean) => void;
}
