export type AstroBoxErrorResponse = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details: Record<string, unknown>;
  };
};

export type AstroBoxDevice = {
  deviceId: string;
  name: string;
  kind: string;
  known: boolean;
  connectionState: string;
  connectType?: string;
  authkey?: string;
  lastError?: string;
};

export type AstroBoxDevicesResponse = {
  devices: AstroBoxDevice[];
};

export type AstroBoxStatusResponse = AstroBoxDevicesResponse;
export type AstroBoxDeviceListResponse = AstroBoxDevicesResponse;
export type AstroBoxDeviceDetail = AstroBoxDevice;

export type AstroBoxConnectRequest = {
  name: string;
  addr: string;
  kind?: "xiaomi" | "vivo";
  authkey?: string;
  sarVersion?: number;
  txWinOverrunAllowance?: number;
  connectType?: "SPP" | "BLE";
};

export type AstroBoxConnectResponse = {
  deviceId: string;
  connectionState: string;
};

export type AstroBoxUploadResponse = {
  uploadId: string;
  fileName: string;
  size: number;
  sha256: string;
  state: string;
  expiresAt: string;
};

export type AstroBoxInstallRequest = {
  deviceId: string;
  uploadId: string;
  resourceType?: string;
  watchfaceId?: string;
};

export type AstroBoxTaskResponse = {
  taskId: string;
  deviceId: string;
  status: string;
  groupId?: string;
};

export type AstroBoxInstallResponse = AstroBoxTaskResponse;

export type AstroBoxQueueTask = {
  taskId: string;
  deviceId: string;
  groupId?: string;
  requestId?: string;
  name: string;
  status: string;
  progress: number;
  progressDesc?: string;
  errorCode?: string;
  errorDetail?: string;
  resultUnknown: boolean;
  attempt: number;
  retryDeadline?: string;
  resourceType?: string;
  createdAt?: string;
  updatedAt?: string;
  canCancelRunning: boolean;
  fileSizeBytes?: number;
};

export type AstroBoxDeviceQueue = {
  deviceId: string;
  status: string;
  progress: number;
  items: AstroBoxQueueTask[];
};

export type AstroBoxQueueStatusResponse = {
  devices: AstroBoxDeviceQueue[];
};

export type AstroBoxQueueControlResponse = {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
};

export type AstroBoxQueueTaskResponse = AstroBoxQueueTask;

export type AstroBoxProviderListResponse = {
  providers: string[];
};

export type AstroBoxProviderStateResponse = {
  providerId: string;
  state: string;
};

export type AstroBoxProviderCategoriesResponse = {
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

export type AstroBoxProviderManifest = {
  item: AstroBoxProviderPageItem;
  links: AstroBoxProviderItemLink[];
  downloads: Record<string, AstroBoxProviderItemDownload>;
  ext: Record<string, unknown>;
};

export type AstroBoxProviderItemResponse = {
  item: AstroBoxProviderManifest;
};

export type AstroBoxProviderDownloadResponse = {
  downloadKey?: string;
  providerDeviceKey?: string;
  trial: boolean;
  download: AstroBoxProviderItemDownload;
};

export type AstroBoxProviderTotalResponse = {
  total: number;
};
