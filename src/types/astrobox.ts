export type AstroBoxDevice = {
  name: string;
  addr: string;
};

export type AstroBoxStatusResponse = {
  ok: boolean;
  connected: boolean;
  device_count: number;
  devices: AstroBoxDevice[];
};

export type AstroBoxInstallResponse = {
  ok: boolean;
  message: string;
  taskId: string | null;
};

export type AstroBoxQueueTaskItem = {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  progress: number;
  status: string;
  fileSize: string;
  progressDesc: string;
  watchfaceId: string | null;
  canModifyId: boolean;
};

export type AstroBoxQueueListStatus = {
  status: string;
  progress: number;
  items: AstroBoxQueueTaskItem[];
};

export type AstroBoxQueueStatusResponse = {
  ok: boolean;
  download: AstroBoxQueueListStatus;
  install: AstroBoxQueueListStatus;
};

export type AstroBoxDeviceDetail = {
  name: string;
  addr: string;
  authkey: string;
  connected: boolean;
  sarVersion: number;
  txWinOverrunAllowance: number;
  connectType: string;
};

export type AstroBoxDeviceListResponse = {
  ok: boolean;
  device_count: number;
  devices: AstroBoxDeviceDetail[];
};

export type AstroBoxConnectRequest = {
  name: string;
  addr: string;
  authkey: string;
  sarVersion?: number;
  txWinOverrunAllowance?: number;
  connectType?: "SPP" | "BLE";
};

export type AstroBoxConnectResponse = {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
};

export type AstroBoxProviderListResponse = {
  ok: boolean;
  providers: string[];
};

export type AstroBoxProviderStateResponse = {
  ok: boolean;
  name: string;
  state: string;
};

export type AstroBoxProviderCategoriesResponse = {
  ok: boolean;
  name: string;
  categories: string[];
};

export type AstroBoxProviderRefreshRequest = {
  cfg: string;
};

export type AstroBoxProviderPageItem = {
  id: string;
  restype: string;
  name: string;
  description?: string;
  preview?: string[];
  icon?: string;
  cover?: string;
  author?: string[] | Array<{ name: string; bindABAccount?: boolean }>;
};

export type AstroBoxProviderPageResponse = {
  ok: boolean;
  name: string;
  page: number;
  limit: number;
  items: AstroBoxProviderPageItem[];
};

export type AstroBoxProviderItemLink = {
  icon: string;
  title: string;
  url: string;
};

export type AstroBoxProviderItemDownload = {
  version: string;
  file_name: string;
  versionCode: number | null;
  url: string | null;
  sha256: string | null;
  display_name: string;
  updatelogs: string | null;
};

export type AstroBoxProviderItemResponse = {
  ok: boolean;
  name: string;
  item: {
    item: AstroBoxProviderPageItem;
    links: AstroBoxProviderItemLink[];
    downloads: Record<string, AstroBoxProviderItemDownload>;
    ext: Record<string, unknown>;
  };
};

export type AstroBoxProviderDownloadResponse = {
  ok: boolean;
  name: string;
  id: string;
  downloadKey: string;
  device?: string;
  trial: boolean;
  download: AstroBoxProviderItemDownload;
};

export type AstroBoxProviderTotalResponse = {
  ok: boolean;
  name: string;
  total: number;
};

export type AstroBoxQueueStartResponse = {
  ok: boolean;
  message: string;
};

export type AstroBoxQueueStopResponse = {
  ok: boolean;
  message: string;
};

export type AstroBoxQueueRemoveRequest = {
  taskId: string;
  queue: "install" | "download";
};

export type AstroBoxQueueRemoveResponse = {
  ok: boolean;
  message: string;
};
