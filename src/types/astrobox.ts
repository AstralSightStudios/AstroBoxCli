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
