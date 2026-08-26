import { Command } from "commander";

import { installFile } from "../lib/install";
import { pathSegment, requestAstroBox } from "../lib/api";
import { fail } from "../lib/errors";
import { renderQueueTable } from "../lib/table";
import type {
  AstroBoxQueueControlResponse,
  AstroBoxQueueStatusResponse,
} from "../types/astrobox";

function createInstallSubCommand(): Command {
  return new Command("install")
    .description("Upload a file and add it to a device's install queue")
    .argument("<path>", "path to the local resource file")
    .requiredOption("--device <deviceId>", "target device ID")
    .option("--resourceType <type>", "resource type")
    .option("--watchfaceId <id>", "watchface ID")
    .option("--wait", "wait for installation to complete and show progress")
    .action(async (
      resourcePath: string,
      options: {
        device: string;
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
      const queue = await requestAstroBox<AstroBoxQueueStatusResponse>(
        `/v2/queue/status${query ? `?${query}` : ""}`,
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
  const result = await requestAstroBox<AstroBoxQueueControlResponse>(
    `/v2/queue/${pathSegment(deviceId)}/${action}`,
    { method: "POST" },
  );
  console.log(result.message ?? `Queue ${action} requested for ${deviceId}`);
}

function createStartCommand(): Command {
  return new Command("start")
    .description("Start a device's install queue")
    .argument("<deviceId>", "target device ID")
    .action(async (deviceId: string) => {
      await changeQueueState(deviceId, "start");
    });
}

function createStopCommand(): Command {
  return new Command("stop")
    .description("Stop a device's install queue")
    .argument("<deviceId>", "target device ID")
    .action(async (deviceId: string) => {
      await changeQueueState(deviceId, "stop");
    });
}

function createRemoveCommand(): Command {
  return new Command("remove")
    .description("Cancel an install task by task ID")
    .argument("<taskId>", "task ID to cancel")
    .action(async (taskId: string) => {
      const result = await requestAstroBox<AstroBoxQueueControlResponse>(
        `/v2/queue/tasks/${pathSegment(taskId)}`,
        { method: "DELETE" },
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
    .addCommand(createRemoveCommand())
    .addCommand(createInstallSubCommand());
}
