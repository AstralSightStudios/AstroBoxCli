import { Command } from "commander";

import { installFile } from "../lib/install";
import { getAstroBoxApiVersion, pathSegment, requestAstroBoxCompatible } from "../lib/api";
import {
  normalizeLegacyControl,
  normalizeLegacyQueueStatus,
  normalizeLegacyTask,
  type LegacyOkResponse,
  type LegacyQueueStatusResponse,
} from "../lib/compat";
import { selectDevice } from "../lib/device";
import { fail } from "../lib/errors";
import { renderQueueTable } from "../lib/table";
import type {
  AstroBoxQueueControlResponse,
  AstroBoxQueueStatusResponse,
  AstroBoxQueueTaskResponse,
} from "../types/astrobox";

function createInstallSubCommand(): Command {
  return new Command("install")
    .description("Upload a file and add it to a device's install queue")
    .argument("<path>", "path to the local resource file")
    .option("--device <deviceId>", "target device ID; auto-selected when exactly one device is connected")
    .option("--resourceType <type>", "resource type")
    .option("--watchfaceId <id>", "watchface ID")
    .option("--wait", "wait for installation to complete and show progress")
    .action(async (
      resourcePath: string,
      options: {
        device?: string;
        resourceType?: string;
        watchfaceId?: string;
        wait?: boolean;
      },
    ) => {
      await installFile(resourcePath, options.device, options.wait ?? false, {
        resourceType: options.resourceType,
        watchfaceId: options.watchfaceId,
      });
    });
}

function createStatusCommand(): Command {
  return new Command("status")
    .description("Show install queue status")
    .option("--device <deviceId>", "only show one device's queue")
    .action(async (options: { device?: string }) => {
      const params = new URLSearchParams();
      if (options.device) params.set("deviceId", options.device);
      const query = params.toString();
      const queue = await requestAstroBoxCompatible<AstroBoxQueueStatusResponse, LegacyQueueStatusResponse>(
        `/v2/queue/status${query ? `?${query}` : ""}`,
        "/queue/status",
        undefined,
        (response) => normalizeLegacyQueueStatus(response, options.device),
      );

      if (queue.devices.length === 0) {
        console.log("Install queue is empty.");
        return;
      }

      let hasError = false;
      const output: string[] = [];
      for (const deviceQueue of queue.devices) {
        output.push(
          `Device: ${deviceQueue.deviceId}`,
          `Install: ${deviceQueue.status} (${Math.round(deviceQueue.progress * 100)}%)`,
          "",
          renderQueueTable(deviceQueue.items),
        );
        if (deviceQueue.items.some((item) => item.status === "failed")) hasError = true;
      }
      console.log(output.join("\n"));

      if (hasError) {
        const failedTask = queue.devices
          .flatMap((deviceQueue) => deviceQueue.items)
          .find((item) => item.status === "failed");
        fail(`Install error: ${failedTask?.errorDetail ?? failedTask?.progressDesc ?? "unknown error"}`);
      }
    });
}

async function changeQueueState(deviceId: string, action: "start" | "stop"): Promise<void> {
  const result = await requestAstroBoxCompatible<AstroBoxQueueControlResponse, LegacyOkResponse>(
    `/v2/queue/${pathSegment(deviceId)}/${action}`,
    `/queue/${action}`,
    { method: "POST" },
    (response) => normalizeLegacyControl(response),
  );
  console.log(result.message ?? `Queue ${action} requested for ${deviceId}`);
}

function createStartCommand(): Command {
  return new Command("start")
    .description("Start a device's install queue")
    .argument("[deviceId]", "target device ID")
    .option("--device <deviceId>", "target device ID; auto-selected when exactly one device is connected")
    .action(async (positionalDeviceId: string | undefined, options: { device?: string }) => {
      const deviceId = await selectDevice(positionalDeviceId, options);
      await changeQueueState(deviceId, "start");
    });
}

function createStopCommand(): Command {
  return new Command("stop")
    .description("Stop a device's install queue")
    .argument("[deviceId]", "target device ID")
    .option("--device <deviceId>", "target device ID; auto-selected when exactly one device is connected")
    .action(async (positionalDeviceId: string | undefined, options: { device?: string }) => {
      const deviceId = await selectDevice(positionalDeviceId, options);
      await changeQueueState(deviceId, "stop");
    });
}

function createTaskCommand(): Command {
  return new Command("task")
    .description("Show an install task by task ID")
    .argument("<taskId>", "task ID to query")
    .action(async (taskId: string) => {
      const task = await requestAstroBoxCompatible<AstroBoxQueueTaskResponse, LegacyQueueStatusResponse>(
        `/v2/queue/tasks/${pathSegment(taskId)}`,
        "/queue/status",
        undefined,
        (response) => normalizeLegacyTask(response, taskId),
      );
      const lines = [
        `Task:     ${task.taskId}`,
        `Device:   ${task.deviceId}`,
        `Status:   ${task.status}`,
        `Progress: ${Math.round(task.progress * 100)}%`,
        renderQueueTable([task]),
      ];
      if (task.progressDesc) lines.push(`Description: ${task.progressDesc}`);
      if (task.errorCode) lines.push(`Error code: ${task.errorCode}`);
      if (task.errorDetail) lines.push(`Error:      ${task.errorDetail}`);
      console.log(lines.join("\n"));
    });
}

function createRemoveCommand(): Command {
  return new Command("remove")
    .description("Cancel an install task by task ID")
    .argument("<taskId>", "task ID to cancel")
    .option("--queue <type>", 'legacy queue type: "install" or "download"', "install")
    .action(async (taskId: string, options: { queue: string }) => {
      if (options.queue !== "install" && options.queue !== "download") {
        fail(`Invalid queue type: ${options.queue}`);
      }
      if (options.queue === "download" && (await getAstroBoxApiVersion()) === "v2") {
        fail('The v2 API only supports the install queue; omit "--queue download".');
      }

      const v2Init: RequestInit = { method: "DELETE" };
      const legacyInit: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, queue: options.queue }),
      };
      const result = await requestAstroBoxCompatible<AstroBoxQueueControlResponse, LegacyOkResponse>(
        `/v2/queue/tasks/${pathSegment(taskId)}`,
        "/queue/remove",
        v2Init,
        (response) => normalizeLegacyControl(response),
        legacyInit,
      );
      console.log(result.message ?? `Task ${taskId} canceled`);
    });
}

export function createQueueCommand(): Command {
  return new Command("queue")
    .description("Manage install queues")
    .addCommand(createStatusCommand())
    .addCommand(createStartCommand())
    .addCommand(createStopCommand())
    .addCommand(createTaskCommand())
    .addCommand(createRemoveCommand())
    .addCommand(createInstallSubCommand());
}
