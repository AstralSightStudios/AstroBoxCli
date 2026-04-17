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
  ok?: boolean;
  message?: string;
  [key: string]: unknown;
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
  author?: string[];
};

export type AstroBoxProviderPageResponse = {
  ok: boolean;
  name: string;
  page: number;
  limit: number;
  items: AstroBoxProviderPageItem[];
};

export type AstroBoxProviderItemResponse = {
  ok: boolean;
  name: string;
  item: Record<string, unknown>;
};

export type AstroBoxProviderTotalResponse = {
  ok: boolean;
  name: string;
  total: number;
};
