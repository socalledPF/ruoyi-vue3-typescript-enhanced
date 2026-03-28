import type { QueryFormItem, QueryFormInstance } from "@/types";

interface JobFilters {
  pageNum: number;
  pageSize: number;
  jobName?: string;
  jobGroup?: string;
  status?: string;
  tagIds?: string[];
}

const filters = reactive<JobFilters>({
  pageNum: 1,
  pageSize: 10,
  jobName: undefined,
  jobGroup: undefined,
  status: undefined,
  tagIds: [],
});

const queryItems = computed<QueryFormItem[]>(() => [
  {
    prop: "jobName",
    label: "任务名称",
    component: "el-input",
    componentProps: {
      placeholder: "请输入任务名称",
    },
  },
  {
    prop: "jobGroup",
    label: "任务组名",
    component: "el-select",
    options: [
      { label: "DEFAULT", value: "DEFAULT" },
      { label: "SYSTEM", value: "SYSTEM" },
    ],
  },
  // custom component using non-default model prop/event
  {
    prop: "tagIds",
    label: "标签",
    component: "CustomTagInput",
    modelProp: "value",
    modelEvent: "change",
    componentProps: {
      placeholder: "请选择标签",
    },
  },
]);

const queryFormRef = ref<QueryFormInstance>();

queryFormRef.value?.query();
queryFormRef.value?.reset();
queryFormRef.value?.toggleExpand(true);

void filters;
void queryItems;
