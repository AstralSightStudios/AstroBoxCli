import { Command } from "commander";

import { requestAstroBox } from "../lib/api";
import { fail } from "../lib/errors";
import type {
  AstroBoxConnectRequest,
  AstroBoxConnectResponse,
  AstroBoxDeviceDetail,
  AstroBoxDeviceListResponse,
} from "../types/astrobox";

function formatDeviceDetail(device: AstroBoxDeviceDetail): string {
  const status = device.connected ? "connected" : "disconnected";
  return `- ${device.name} (${device.addr}) [${status}]`;
}

function renderDeviceFull(device: AstroBoxDeviceDetail): string {
  const lines = [
    `Name:     ${device.name}`,
    `Address:  ${device.addr}`,
    `AuthKey:  ${device.authkey}`,
    `Status:   ${device.connected ? "connected" : "disconnected"}`,
    `SAR Ver:  ${device.sarVersion}`,
    `TX Win:   ${device.txWinOverrunAllowance}`,
    `Type:     ${device.connectType}`,
  ];
  return lines.join("\n");
}

function createListCommand(): Command {
  return new Command("list")
    .description("List saved devices and their connection status")
    .action(async () => {
      const result = await requestAstroBox<AstroBoxDeviceListResponse>("/device/list");

      const lines = [
        `Devices: ${result.device_count}`,
      ];

      if (result.devices.length > 0) {
        lines.push(...result.devices.map(formatDeviceDetail));
      }

      console.log(lines.join("\n"));
    });
}

function createShowCommand(): Command {
  return new Command("show")
    .description("Show full details for a device by address")
    .argument("<addr>", "device MAC address")
    .action(async (addr: string) => {
      const result = await requestAstroBox<AstroBoxDeviceListResponse>("/device/list");
      const device = result.devices.find((d) => d.addr === addr);

      if (!device) {
        fail(`Device not found: ${addr}`);
      }

      console.log(renderDeviceFull(device));
    });
}

interface ConnectOptions {
  name: string;
  addr: string;
  authkey: string;
  sarVersion: string;
  txWinOverrunAllowance?: string;
  connectType: string;
}

function buildConnectBody(options: ConnectOptions): AstroBoxConnectRequest {
  const body: AstroBoxConnectRequest = {
    name: options.name,
    addr: options.addr,
    authkey: options.authkey,
    sarVersion: Number(options.sarVersion),
    connectType: options.connectType as "SPP" | "BLE",
  };

  if (options.txWinOverrunAllowance !== undefined) {
    body.txWinOverrunAllowance = Number(options.txWinOverrunAllowance);
  }

  if (body.connectType !== "SPP" && body.connectType !== "BLE") {
    fail(`Invalid connectType: ${body.connectType}. Must be "SPP" or "BLE".`);
  }

  return body;
}

async function sendConnectRequest(body: AstroBoxConnectRequest): Promise<AstroBoxConnectResponse> {
  return requestAstroBox<AstroBoxConnectResponse>("/device/connect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function handleConnectResult(result: AstroBoxConnectResponse, name: string, addr: string): void {
  if (result.ok) {
    console.log(`Connected to ${name} (${addr})`);
  } else {
    const msg = result.message ?? "Unknown error";
    fail(`Failed to connect: ${msg}`);
  }
}

function createConnectCommand(): Command {
  return new Command("connect")
    .description("Add and connect a new device")
    .requiredOption("--name <name>", "device name")
    .requiredOption("--addr <addr>", "device MAC address")
    .requiredOption("--authkey <authkey>", "device auth key")
    .option("--sarVersion <version>", "SAR version", "2")
    .option("--txWinOverrunAllowance <allowance>", "TX window overrun allowance")
    .option("--connectType <type>", "connection type (SPP or BLE)", "SPP")
    .action(async (options: ConnectOptions) => {
      const body = buildConnectBody(options);

      console.log("Connecting...");
      const result = await sendConnectRequest(body);
      handleConnectResult(result, options.name, options.addr);
    });
}

export function createDeviceCommand(): Command {
  const command = new Command("device")
    .description("Manage AstroBox devices")
    .addCommand(createListCommand())
    .addCommand(createShowCommand())
    .addCommand(createConnectCommand());

  return command;
}
