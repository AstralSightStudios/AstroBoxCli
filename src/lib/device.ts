import { requestAstroBoxCompatible } from "./api";
import { normalizeLegacyDeviceList, type LegacyDeviceListResponse } from "./compat";
import { fail } from "./errors";
import type { AstroBoxDevice, AstroBoxDeviceListResponse } from "../types/astrobox";

export type DeviceSelection = {
  device?: string;
};

function isConnected(device: AstroBoxDevice): boolean {
  return device.connectionState.toLowerCase() === "connected";
}

function renderConnectedDevices(devices: AstroBoxDevice[]): string {
  return devices
    .map((device) => `- ${device.name} (${device.deviceId})`)
    .join("\n");
}

export async function resolveDeviceId(deviceId?: string): Promise<string> {
  if (deviceId) return deviceId;

  const result = await requestAstroBoxCompatible<AstroBoxDeviceListResponse, LegacyDeviceListResponse>(
    "/v2/devices",
    "/device/list",
    undefined,
    normalizeLegacyDeviceList,
  );
  const connected = result.devices.filter(isConnected);

  if (connected.length === 1) return connected[0].deviceId;
  if (connected.length === 0) {
    fail("No devices connected. Connect a device first.");
  }

  fail(
    [
      "Multiple devices connected:",
      renderConnectedDevices(connected),
      "Use --device <deviceId> to select one.",
    ].join("\n"),
  );
}

export function selectDevice(
  positionalDevice: string | undefined,
  options: DeviceSelection,
): Promise<string> {
  if (positionalDevice && options.device) {
    fail("Specify the device either as an argument or with --device, not both.");
  }
  return resolveDeviceId(options.device ?? positionalDevice);
}

export function jsonOutput(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
