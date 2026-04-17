import { Command } from "commander";

import { requestAstroBox } from "../lib/api";
import type { AstroBoxDevice, AstroBoxStatusResponse } from "../types/astrobox";

function formatAstroBoxStatus(ok: boolean): string {
  return ok ? "connected" : "unavailable";
}

function formatDevice(device: AstroBoxDevice): string {
  return `- ${device.name} (${device.addr})`;
}

function renderStatus(status: AstroBoxStatusResponse): string {
  const lines = [
    `AstroBox: ${formatAstroBoxStatus(status.ok)}`,
    `Devices: ${status.device_count}`,
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
      const status = await requestAstroBox<AstroBoxStatusResponse>("/status");
      console.log(renderStatus(status));
    });
}
