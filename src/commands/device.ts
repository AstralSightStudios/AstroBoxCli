import { Command } from "commander";

import { pathSegment, requestAstroBox } from "../lib/api";
import { fail } from "../lib/errors";
import type {
  AstroBoxConnectRequest,
  AstroBoxConnectResponse,
  AstroBoxDevice,
  AstroBoxDeviceListResponse,
} from "../types/astrobox";

function formatDeviceDetail(device: AstroBoxDevice): string {
  return `- ${device.name} (${device.deviceId}) [${device.connectionState}]`;
}

function renderDeviceFull(device: AstroBoxDevice): string {
  const lines = [
    `Name:      ${device.name}`,
    `Device ID: ${device.deviceId}`,
    `Kind:      ${device.kind}`,
    `Known:     ${device.known ? "yes" : "no"}`,
    `Status:    ${device.connectionState}`,
    `AuthKey:   ${device.authkey ?? "-"}`,
    `Type:      ${device.connectType ?? "-"}`,
  ];
  if (device.lastError) lines.push(`Error:     ${device.lastError}`);
  return lines.join("\n");
}

function createListCommand(): Command {
  return new Command("list")
    .description("List saved devices and their connection status")
    .action(async () => {
      const result = await requestAstroBox<AstroBoxDeviceListResponse>("/v2/devices");
      const lines = [`Devices: ${result.devices.length}`];
      if (result.devices.length > 0) {
        lines.push(...result.devices.map(formatDeviceDetail));
      }
      console.log(lines.join("\n"));
    });
}

function createShowCommand(): Command {
  return new Command("show")
    .description("Show full details for a device by device ID")
    .argument("<deviceId>", "device ID, usually a device MAC address")
    .action(async (deviceId: string) => {
      const result = await requestAstroBox<AstroBoxDevice>(
        `/v2/devices/${pathSegment(deviceId)}`,
      );
      console.log(renderDeviceFull(result));
    });
}

interface ConnectOptions {
  name: string;
  addr: string;
  authkey: string;
  kind?: string;
  sarVersion: string;
  txWinOverrunAllowance?: string;
  connectType: string;
}

function parseNumber(value: string, optionName: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    fail(`${optionName} must be a non-negative integer`);
  }
  return number;
}

function buildConnectBody(options: ConnectOptions): AstroBoxConnectRequest {
  const body: AstroBoxConnectRequest = {
    name: options.name,
    addr: options.addr,
    authkey: options.authkey,
    sarVersion: parseNumber(options.sarVersion, "--sarVersion"),
    connectType: options.connectType as "SPP" | "BLE",
  };

  if (options.kind !== undefined) {
    const kind = options.kind.toLowerCase();
    if (kind !== "xiaomi" && kind !== "vivo") {
      fail(`Invalid kind: ${options.kind}. Must be "xiaomi" or "vivo".`);
    }
    body.kind = kind;
  }

  if (options.txWinOverrunAllowance !== undefined) {
    body.txWinOverrunAllowance = parseNumber(
      options.txWinOverrunAllowance,
      "--txWinOverrunAllowance",
    );
  }

  if (body.connectType !== "SPP" && body.connectType !== "BLE") {
    fail(`Invalid connectType: ${body.connectType}. Must be "SPP" or "BLE".`);
  }

  return body;
}

async function sendConnectRequest(
  body: AstroBoxConnectRequest,
): Promise<AstroBoxConnectResponse> {
  return requestAstroBox<AstroBoxConnectResponse>("/v2/devices/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createConnectCommand(): Command {
  return new Command("connect")
    .description("Add and connect a new device")
    .requiredOption("--name <name>", "device name")
    .requiredOption("--addr <addr>", "device MAC address")
    .requiredOption("--authkey <authkey>", "device auth key")
    .option("--kind <kind>", "device kind (xiaomi or vivo)")
    .option("--sarVersion <version>", "SAR version", "2")
    .option("--txWinOverrunAllowance <allowance>", "TX window overrun allowance")
    .option("--connectType <type>", "connection type (SPP or BLE)", "SPP")
    .action(async (options: ConnectOptions) => {
      const body = buildConnectBody(options);
      console.log("Connecting...");
      const result = await sendConnectRequest(body);
      console.log(`Connected to ${body.name} (${result.deviceId})`);
    });
}

export function createDeviceCommand(): Command {
  return new Command("device")
    .description("Manage AstroBox devices")
    .addCommand(createListCommand())
    .addCommand(createShowCommand())
    .addCommand(createConnectCommand());
}
