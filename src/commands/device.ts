import { Command } from "commander";

import { pathSegment, requestAstroBox } from "../lib/api";
import { fail } from "../lib/errors";
import { jsonOutput, selectDevice } from "../lib/device";
import type {
  AstroBoxConnectRequest,
  AstroBoxConnectResponse,
  AstroBoxDevice,
  AstroBoxDeviceData,
  AstroBoxDeviceListResponse,
  AstroBoxResourceListResponse,
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
    .description("Show full details for a device")
    .argument("[deviceId]", "device ID, usually a device MAC address")
    .option("--device <deviceId>", "target device ID")
    .action(async (positionalDeviceId: string | undefined, options: { device?: string }) => {
      const deviceId = await selectDevice(positionalDeviceId, options);
      const result = await requestAstroBox<AstroBoxDevice>(
        `/v2/devices/${pathSegment(deviceId)}`,
      );
      console.log(renderDeviceFull(result));
    });
}

function createDisconnectCommand(): Command {
  return new Command("disconnect")
    .description("Disconnect a device")
    .argument("[deviceId]", "device ID, usually a device MAC address")
    .option("--device <deviceId>", "target device ID")
    .action(async (positionalDeviceId: string | undefined, options: { device?: string }) => {
      const deviceId = await selectDevice(positionalDeviceId, options);
      await requestAstroBox<void>(
        `/v2/devices/${pathSegment(deviceId)}/connection`,
        { method: "DELETE" },
      );
      console.log(`Disconnected ${deviceId}`);
    });
}

interface DataOptions {
  device?: string;
  type: string;
}

function createDataCommand(): Command {
  return new Command("data")
    .description("Get device data")
    .argument("[deviceId]", "device ID, usually a device MAC address")
    .option("--device <deviceId>", "target device ID")
    .option("--type <type>", "data type: info, status, or storage", "info")
    .action(async (positionalDeviceId: string | undefined, options: DataOptions) => {
      if (options.type !== "info" && options.type !== "status" && options.type !== "storage") {
        fail(`Invalid data type: ${options.type}. Must be info, status, or storage.`);
      }
      const deviceId = await selectDevice(positionalDeviceId, options);
      const params = new URLSearchParams({ type: options.type });
      const result = await requestAstroBox<AstroBoxDeviceData>(
        `/v2/devices/${pathSegment(deviceId)}/data?${params.toString()}`,
      );
      console.log(jsonOutput(result));
    });
}

function createWatchfaceListCommand(): Command {
  return new Command("list")
    .description("List watchfaces installed on a device")
    .option("--device <deviceId>", "target device ID")
    .action(async (options: { device?: string }) => {
      const deviceId = await selectDevice(undefined, options);
      const result = await requestAstroBox<AstroBoxResourceListResponse>(
        `/v2/devices/${pathSegment(deviceId)}/watchfaces`,
      );
      console.log(jsonOutput(result.items));
    });
}

function createWatchfaceCurrentCommand(): Command {
  return new Command("current")
    .description("Set the current watchface on a device")
    .argument("<watchfaceId>", "watchface ID")
    .option("--device <deviceId>", "target device ID")
    .action(async (watchfaceId: string, options: { device?: string }) => {
      const deviceId = await selectDevice(undefined, options);
      await requestAstroBox<void>(
        `/v2/devices/${pathSegment(deviceId)}/watchfaces/current`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchfaceId }),
        },
      );
      console.log(`Watchface ${watchfaceId} is now current on ${deviceId}`);
    });
}

function createWatchfaceRemoveCommand(): Command {
  return new Command("remove")
    .description("Remove a watchface from a device")
    .argument("<watchfaceId>", "watchface ID")
    .option("--device <deviceId>", "target device ID")
    .action(async (watchfaceId: string, options: { device?: string }) => {
      const deviceId = await selectDevice(undefined, options);
      await requestAstroBox<void>(
        `/v2/devices/${pathSegment(deviceId)}/watchfaces/${pathSegment(watchfaceId)}`,
        { method: "DELETE" },
      );
      console.log(`Watchface ${watchfaceId} removed from ${deviceId}`);
    });
}

function createWatchfaceCommand(): Command {
  return new Command("watchface")
    .description("Manage watchfaces installed on a device")
    .addCommand(createWatchfaceListCommand())
    .addCommand(createWatchfaceCurrentCommand())
    .addCommand(createWatchfaceRemoveCommand());
}

function createAppListCommand(): Command {
  return new Command("list")
    .description("List quick apps installed on a device")
    .option("--device <deviceId>", "target device ID")
    .action(async (options: { device?: string }) => {
      const deviceId = await selectDevice(undefined, options);
      const result = await requestAstroBox<AstroBoxResourceListResponse>(
        `/v2/devices/${pathSegment(deviceId)}/quick-apps`,
      );
      console.log(jsonOutput(result.items));
    });
}

function createAppOpenCommand(): Command {
  return new Command("open")
    .description("Open a quick app on a device")
    .argument("<packageName>", "quick app package name")
    .option("--device <deviceId>", "target device ID")
    .option("--page <page>", "page to open")
    .action(async (
      packageName: string,
      options: { device?: string; page?: string },
    ) => {
      const deviceId = await selectDevice(undefined, options);
      await requestAstroBox<void>(
        `/v2/devices/${pathSegment(deviceId)}/quick-apps/${pathSegment(packageName)}/open`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: options.page ?? "" }),
        },
      );
      console.log(`Opened ${packageName} on ${deviceId}`);
    });
}

function createAppRemoveCommand(): Command {
  return new Command("remove")
    .description("Remove a quick app from a device")
    .argument("<packageName>", "quick app package name")
    .option("--device <deviceId>", "target device ID")
    .action(async (packageName: string, options: { device?: string }) => {
      const deviceId = await selectDevice(undefined, options);
      await requestAstroBox<void>(
        `/v2/devices/${pathSegment(deviceId)}/quick-apps/${pathSegment(packageName)}`,
        { method: "DELETE" },
      );
      console.log(`Quick app ${packageName} removed from ${deviceId}`);
    });
}

function createAppCommand(): Command {
  return new Command("app")
    .alias("quick-app")
    .description("Manage quick apps installed on a device")
    .addCommand(createAppListCommand())
    .addCommand(createAppOpenCommand())
    .addCommand(createAppRemoveCommand());
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
    .description("Manage devices and installed resources")
    .addCommand(createListCommand())
    .addCommand(createShowCommand())
    .addCommand(createConnectCommand())
    .addCommand(createDisconnectCommand())
    .addCommand(createDataCommand())
    .addCommand(createWatchfaceCommand())
    .addCommand(createAppCommand());
}
