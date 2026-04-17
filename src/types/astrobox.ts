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
