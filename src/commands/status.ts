import { Command } from "commander";

import { requestAstroBoxCompatible } from "../lib/api";
import { normalizeLegacyStatus, type LegacyStatusResponse } from "../lib/compat";
import type { AstroBoxDevice, AstroBoxStatusResponse } from "../types/astrobox";

function formatDevice(device: AstroBoxDevice): string {
  return `- ${device.name} (${device.deviceId}) [${device.connectionState}]`;
}

function renderStatus(status: AstroBoxStatusResponse): string {
  const lines = [
    `AstroBox: ${status.astroBoxConnected === false ? "unavailable" : "connected"}`,
    `Devices: ${status.devices.length}`,
  ];

  if (status.devices.length > 0) {
    lines.push(...status.devices.map(formatDevice));
  }

  return lines.join("\n");
}

export function createStatusCommand(): Command {
  return new Command("status")
    .description("Query AstroBox connection status")
    .action(async () => {
      const status = await requestAstroBoxCompatible<AstroBoxStatusResponse, LegacyStatusResponse>(
        "/v2/devices",
        "/status",
        undefined,
        normalizeLegacyStatus,
      );
      console.log(renderStatus(status));
    });
}
