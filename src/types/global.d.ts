/** Global module/type declarations */

type AppTabTool = typeof import("@/plugins/tab").default;
type AppAuthTool = typeof import("@/plugins/auth").default;
type AppCacheTool = typeof import("@/plugins/cache").default;
type AppModalTool = typeof import("@/plugins/modal").default;
type AppDownloadTool = typeof import("@/plugins/download").default;
type UseDictFn = typeof import("@/utils/dict").useDict;
type RequestDownloadFn = typeof import("@/utils/request").download;
type ParseTimeFn = typeof import("@/utils/ruoyi").parseTime;
type AddDateRangeFn = typeof import("@/utils/ruoyi").addDateRange;
type HandleTreeFn = <T extends object>(
  data: T[] | undefined,
  id?: string,
  parentId?: string,
  children?: string,
) => T[];
type SelectDictLabelFn = typeof import("@/utils/ruoyi").selectDictLabel;
type SelectDictLabelsFn = typeof import("@/utils/ruoyi").selectDictLabels;
type GetConfigKeyFn = typeof import("@/api/system/config").getConfigKey;

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_BASE_API: string;
  readonly VITE_APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "vue" {
  export interface ComponentCustomProperties {
    $tab: AppTabTool;
    $auth: AppAuthTool;
    $cache: AppCacheTool;
    $modal: AppModalTool;
    $download: AppDownloadTool;
    useDict: UseDictFn;
    download: RequestDownloadFn;
    parseTime: ParseTimeFn;
    resetForm: (refName: string) => void;
    handleTree: HandleTreeFn;
    addDateRange: AddDateRangeFn;
    getConfigKey: GetConfigKeyFn;
    selectDictLabel: SelectDictLabelFn;
    selectDictLabels: SelectDictLabelsFn;
    idGlobal?: number;
  }

  export interface App {
    use: (...args: unknown[]) => App;
    mount: (...args: unknown[]) => unknown;
    component: (...args: unknown[]) => App;
    directive: (...args: unknown[]) => App;
    config: {
      globalProperties: Record<string, unknown>;
    };
  }

  interface AppRefLike extends HTMLElement {
    $el: HTMLElement;
    $refs: Record<string, AppRefLike>;
    click: () => void;
    show: () => void;
    submit: () => void;
    filter: (value: string) => void;
    setCurrentKey: (key: unknown) => void;
    sort: (prop: string, order: string) => void;
    validate: (callback: (valid: boolean) => void) => void;
    toggleRowSelection: (row: unknown) => void;
    handleRemove: (file: unknown) => void;
    rotateLeft: () => void;
    rotateRight: () => void;
    changeScale: (num: number) => void;
    getCropBlob: (callback: (data: Blob) => void) => void;
  }

  type AppProxy = Omit<ComponentPublicInstance, "$refs"> &
    ComponentCustomProperties & {
      $refs: Record<string, AppRefLike>;
    };

  export function createApp(...args: unknown[]): App;
  export function getCurrentInstance(): ComponentInternalInstance;
  interface ComponentInternalInstance {
    proxy: AppProxy;
  }
}

declare module "nprogress" {
  export interface NProgressOptions {
    minimum?: number;
    template?: string;
    easing?: string;
    speed?: number;
    trickle?: boolean;
    trickleSpeed?: number;
    showSpinner?: boolean;
    parent?: string;
    barSelector?: string;
  }

  export interface NProgress {
    start(): NProgress;
    set(n: number): NProgress;
    inc(amount?: number): NProgress;
    done(force?: boolean): NProgress;
    remove(): void;
    configure(options: NProgressOptions): NProgress;
    status: number | null;
  }

  const nprogress: NProgress;
  export default nprogress;
}

declare module "js-cookie" {
  export default Cookies;
}

declare module "file-saver" {
  export function saveAs(
    data: Blob | string,
    filename?: string,
    options?: unknown,
  ): void;
  export function saveAs(
    data: Blob | string,
    filename?: string,
    disableAutoBOM?: boolean,
  ): void;
  export default saveAs;
}

declare module "jsencrypt/bin/jsencrypt.min" {
  import JSEncrypt from "jsencrypt";
  export default JSEncrypt;
}

declare module "@vueup/vue-quill";

declare module "sortablejs" {
  export interface SortableEvent {
    oldIndex: number;
    newIndex: number;
  }

  export interface SortableOptions {
    ghostClass?: string;
    handle?: string;
    onEnd?: (evt: SortableEvent) => void;
  }

  export default class Sortable {
    static create(el: HTMLElement, options: SortableOptions): Sortable;
  }
}

declare module "fuse.js" {
  export interface FuseOptions<T> {
    keys: string[];
    threshold?: number;
    includeScore?: boolean;
    includeMatches?: boolean;
    minMatchCharLength?: number;
    shouldSort?: boolean;
  }

  export interface FuseResult<T> {
    item: T;
  }

  export default class Fuse<T> {
    constructor(list: T[], options?: FuseOptions<T>);
    search(pattern: string): FuseResult<T>[];
  }
}

declare module "vuedraggable/dist/vuedraggable.common" {
  import { DefineComponent } from "vue";
  const draggable: DefineComponent;
  export default draggable;
}

declare module "vue-cropper" {
  import { DefineComponent } from "vue";
  const VueCropper: DefineComponent;
  export { VueCropper };
}

declare module "splitpanes" {
  import { DefineComponent } from "vue";

  export const Splitpanes: DefineComponent;
  export const Pane: DefineComponent;
}
