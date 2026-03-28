import {
  ElButton,
  ElCard,
  ElInput,
  ElProgress,
  ElSpace,
  ElTag,
} from "element-plus";

interface DemoTask {
  id: number;
  title: string;
  done: boolean;
}

const panelStyle = {
  maxWidth: "860px",
  margin: "0 auto",
};

const listStyle = {
  margin: "16px 0 0",
  padding: 0,
  listStyle: "none",
  display: "grid",
  gap: "10px",
};

export default defineComponent({
  name: "TsxTestPage",
  setup() {
    const nextTask = ref("");
    const state = reactive({
      clicks: 0,
      taskId: 4,
      tasks: [
        { id: 1, title: "Install Vue JSX plugin", done: true },
        { id: 2, title: "Enable TSX in tsconfig.json", done: true },
        { id: 3, title: "Create /test/tsx page", done: false },
      ] as DemoTask[],
    });

    const doneCount = computed(
      () => state.tasks.filter((task: DemoTask) => task.done).length,
    );
    const progress = computed(() => {
      if (!state.tasks.length) {
        return 0;
      }
      return Math.round((doneCount.value / state.tasks.length) * 100);
    });

    const addTask = () => {
      const title = nextTask.value.trim();
      if (!title) {
        return;
      }
      state.tasks.push({
        id: state.taskId++,
        title,
        done: false,
      });
      nextTask.value = "";
    };

    const toggleTask = (taskId: number, done: boolean) => {
      const task = state.tasks.find((item: DemoTask) => item.id === taskId);
      if (task) {
        task.done = done;
      }
    };

    return () => (
      <div class="app-container">
        <ElCard shadow="never" style={panelStyle}>
          <h2 style={{ margin: "0 0 8px" }}>TSX Test Page</h2>
          <p style={{ margin: 0, color: "#606266" }}>
            This page is rendered from <code>src/views/test/tsx.tsx</code>.
          </p>

          <ElSpace wrap style={{ marginTop: "14px" }}>
            <ElButton type="primary" onClick={() => (state.clicks += 1)}>
              TSX Button Clicks: {state.clicks}
            </ElButton>
            <ElTag type="success">
              Done {doneCount.value}/{state.tasks.length}
            </ElTag>
            <ElTag type="warning">
              Pending {state.tasks.length - doneCount.value} /{" "}
              {state.tasks.length}
            </ElTag>
            <ElTag>{progress.value}% complete</ElTag>
          </ElSpace>

          <ElProgress
            percentage={progress.value}
            strokeWidth={10}
            style={{ marginTop: "14px" }}
          />

          <ElSpace style={{ marginTop: "16px", width: "100%" }}>
            <ElInput
              modelValue={nextTask.value}
              placeholder="Type a task and press Enter"
              onUpdate:modelValue={(value: string) => {
                nextTask.value = value;
              }}
              onKeyup={(event: KeyboardEvent) => {
                if (event.key === "Enter") {
                  addTask();
                }
              }}
            />
            <ElButton onClick={addTask}>Add</ElButton>
          </ElSpace>

          <ul style={listStyle}>
            {state.tasks.map((task: DemoTask) => (
              <li
                key={task.id}
                style={{
                  border: "1px solid #ebeef5",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(event: Event) => {
                      toggleTask(
                        task.id,
                        (event.target as HTMLInputElement).checked,
                      );
                    }}
                  />
                  <span
                    style={{
                      textDecoration: task.done ? "line-through" : "none",
                      color: task.done ? "#909399" : "#303133",
                    }}
                  >
                    {task.title}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </ElCard>
      </div>
    );
  },
});
