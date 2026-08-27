import type {
  AstroBoxConnectResponse,
  AstroBoxDevice,
  AstroBoxDeviceListResponse,
  AstroBoxInstallResponse,
  AstroBoxProviderCategoriesResponse,
  AstroBoxProviderDownloadResponse,
  AstroBoxProviderItemResponse,
  AstroBoxProviderListResponse,
  AstroBoxProviderPageResponse,
  AstroBoxProviderStateResponse,
  AstroBoxProviderTotalResponse,
  AstroBoxQueueStatusResponse,
  AstroBoxStatusResponse,
  AstroBoxQueueTask,
} from "../types/astrobox";

export type LegacyStatusResponse = {
  ok: boolean;
  connected: boolean;
  device_count: number;
  devices: Array<{ name: string; addr: string }>;
};

export type LegacyDeviceDetail = {
  name: string;
  addr: string;
  authkey: string;
  connected: boolean;
  sarVersion: number;
  txWinOverrunAllowance: number;
  connectType: string;
};

export type LegacyDeviceListResponse = {
  ok: boolean;
  device_count: number;
  devices: LegacyDeviceDetail[];
};

export type LegacyConnectResponse = {
  ok: boolean;
  message?: string;
};

export type LegacyQueueTaskItem = {
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

export type LegacyQueueListStatus = {
  status: string;
  progress: number;
  items: LegacyQueueTaskItem[];
};

export type LegacyQueueStatusResponse = {
  ok: boolean;
  download: LegacyQueueListStatus;
  install: LegacyQueueListStatus;
};

export type LegacyInstallResponse = {
  ok: boolean;
  message: string;
  taskId: string | null;
};

export type LegacyProviderListResponse = {
  ok: boolean;
  providers: string[];
};

export type LegacyProviderStateResponse = {
  ok: boolean;
  name: string;
  state: string;
};

export type LegacyProviderCategoriesResponse = {
  ok: boolean;
  name: string;
  categories: string[];
};

export type LegacyProviderPageResponse = {
  ok: boolean;
  name: string;
  page: number;
  limit: number;
  items: AstroBoxProviderPageResponse["items"];
};

export type LegacyProviderItemResponse = {
  ok: boolean;
  name: string;
  item: AstroBoxProviderItemResponse["item"];
};

export type LegacyProviderDownloadResponse = {
  ok: boolean;
  name: string;
  id: string;
  downloadKey: string;
  device?: string;
  trial: boolean;
  download: AstroBoxProviderDownloadResponse["download"];
};

export type LegacyProviderTotalResponse = {
  ok: boolean;
  name: string;
  total: number;
};

export type LegacyOkResponse = {
  ok: boolean;
  message?: string;
};

export function requireLegacyOk<T extends LegacyOkResponse>(response: T, operation: string): T {
  if (response.ok === false) {
    throw new Error(response.message ?? `${operation} failed`);
  }
  return response;
}

function legacyDeviceToCurrent(device: LegacyDeviceDetail): AstroBoxDevice {
  return {
    deviceId: device.addr,
    name: device.name,
    kind: "unknown",
    known: true,
    connectionState: device.connected ? "connected" : "disconnected",
    connectType: device.connectType,
    authkey: device.authkey,
  };
}

export function normalizeLegacyStatus(response: LegacyStatusResponse): AstroBoxStatusResponse {
  return {
    devices: response.devices.map((device) => ({
      deviceId: device.addr,
      name: device.name,
      kind: "unknown",
      known: true,
      connectionState: response.connected ? "connected" : "disconnected",
    })),
    astroBoxConnected: response.ok,
  };
}

export function normalizeLegacyDeviceList(
  response: LegacyDeviceListResponse,
): AstroBoxDeviceListResponse {
  requireLegacyOk(response, "Device list request");
  return { devices: response.devices.map(legacyDeviceToCurrent) };
}

export function normalizeLegacyDevice(
  response: LegacyDeviceListResponse,
  deviceId: string,
): AstroBoxDevice {
  const result = normalizeLegacyDeviceList(response);
  const device = result.devices.find((item) => item.deviceId === deviceId);
  if (!device) throw new Error(`Device not found: ${deviceId}`);
  return device;
}

export function normalizeLegacyConnect(
  response: LegacyConnectResponse,
  deviceId: string,
): AstroBoxConnectResponse {
  requireLegacyOk(response, "Device connection request");
  return { deviceId, connectionState: "connected" };
}

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return progress > 1 ? progress / 100 : progress;
}

function normalizeTaskStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "error":
    case "failed":
      return "failed";
    case "cancelled":
    case "canceled":
      return "canceled";
    case "success":
    case "succeeded":
    case "completed":
      return "succeeded";
    default:
      return status;
  }
}

function legacyTaskToCurrent(item: LegacyQueueTaskItem, deviceId: string): AstroBoxQueueTask {
  const progressDesc = item.progressDesc || item.description;
  return {
    taskId: item.id,
    deviceId,
    name: item.name,
    status: normalizeTaskStatus(item.status),
    progress: normalizeProgress(item.progress),
    progressDesc: progressDesc || undefined,
    resourceType: item.type || undefined,
    resultUnknown: false,
    attempt: 0,
    canCancelRunning: item.canModifyId,
  };
}

export function normalizeLegacyQueueStatus(
  response: LegacyQueueStatusResponse,
  deviceId = "legacy",
): AstroBoxQueueStatusResponse {
  requireLegacyOk(response, "Queue status request");
  const items = response.install.items.map((item) => legacyTaskToCurrent(item, deviceId));
  if (items.length === 0) return { devices: [] };

  return {
    devices: [
      {
        deviceId,
        status: response.install.status,
        progress: normalizeProgress(response.install.progress),
        items,
      },
    ],
  };
}

export function normalizeLegacyTask(
  response: LegacyQueueStatusResponse,
  taskId: string,
  deviceId = "legacy",
): AstroBoxQueueTask {
  const queue = normalizeLegacyQueueStatus(response, deviceId);
  const task = queue.devices.flatMap((deviceQueue) => deviceQueue.items).find(
    (item) => item.taskId === taskId,
  );
  if (!task) throw new Error(`Task not found: ${taskId}`);
  return task;
}

export function normalizeLegacyProviderList(
  response: LegacyProviderListResponse,
): AstroBoxProviderListResponse {
  requireLegacyOk(response, "Provider list request");
  return { providers: response.providers };
}

export function normalizeLegacyProviderState(
  response: LegacyProviderStateResponse,
): AstroBoxProviderStateResponse {
  requireLegacyOk(response, "Provider state request");
  return { providerId: response.name, state: response.state };
}

export function normalizeLegacyProviderCategories(
  response: LegacyProviderCategoriesResponse,
): AstroBoxProviderCategoriesResponse {
  requireLegacyOk(response, "Provider categories request");
  return { categories: response.categories };
}

export function normalizeLegacyProviderPage(
  response: LegacyProviderPageResponse,
): AstroBoxProviderPageResponse {
  requireLegacyOk(response, "Provider page request");
  return { page: response.page, limit: response.limit, items: response.items };
}

export function normalizeLegacyProviderItem(
  response: LegacyProviderItemResponse,
): AstroBoxProviderItemResponse {
  requireLegacyOk(response, "Provider item request");
  return { item: response.item };
}

export function normalizeLegacyProviderDownload(
  response: LegacyProviderDownloadResponse,
): AstroBoxProviderDownloadResponse {
  requireLegacyOk(response, "Provider download request");
  return {
    downloadKey: response.downloadKey,
    trial: response.trial,
    download: response.download,
  };
}

export function normalizeLegacyProviderTotal(
  response: LegacyProviderTotalResponse,
): AstroBoxProviderTotalResponse {
  requireLegacyOk(response, "Provider total request");
  return { total: response.total };
}

export function normalizeLegacyControl(response: LegacyOkResponse): { ok: boolean; message?: string } {
  return requireLegacyOk(response, "AstroBox request");
}

export function normalizeLegacyInstall(
  response: LegacyInstallResponse,
): AstroBoxInstallResponse {
  requireLegacyOk(response, "Installation request");
  if (!response.taskId) throw new Error(response.message || "Installation did not return a task ID");
  return { taskId: response.taskId, deviceId: "legacy", status: "queued" };
}
