import { Command } from "commander";

import { installFile } from "../lib/install";
import { requestAstroBox } from "../lib/api";
import { fail } from "../lib/errors";
import { renderQueueTable } from "../lib/table";
import type {
  AstroBoxQueueRemoveRequest,
  AstroBoxQueueRemoveResponse,
  AstroBoxQueueStartResponse,
  AstroBoxQueueStatusResponse,
  AstroBoxQueueStopResponse,
} from "../types/astrobox";

function createInstallSubCommand(): Command {
  return new Command("install")
    .description("Add a file to the install queue")
    .argument("<path>", "path to the local resource file")
    .option("--wait", "wait for installation to complete and show progress")
    .action(async (resourcePath: string, options: { wait?: boolean }) => {
      await installFile(resourcePath, options.wait ?? false);
    });
}

function createStatusCommand(): Command {
  return new Command("status")
    .description("Show install queue status")
    .action(async () => {
      const queue = await requestAstroBox<AstroBoxQueueStatusResponse>("/queue/status", {
        method: "GET",
      });

      if (!queue.ok) {
        fail("Queue status request failed");
      }

      const table = renderQueueTable(queue.install.items);
      console.log(`Install: ${queue.install.status} (${queue.install.progress}%)\n\n${table}`);

      if (queue.install.status === "pending") {
        const errorItem = queue.install.items.find((item) => item.status === "error");
        if (errorItem) {
          fail(`Install error: ${errorItem.progressDesc}`);
        }
      }
    });
}

function createStartCommand(): Command {
  return new Command("start")
    .description("Start the install queue")
    .action(async () => {
      const result = await requestAstroBox<AstroBoxQueueStartResponse>("/queue/start", {
        method: "POST",
      });

      console.log(result.message);
    });
}

function createStopCommand(): Command {
  return new Command("stop")
    .description("Stop the install queue")
    .action(async () => {
      const result = await requestAstroBox<AstroBoxQueueStopResponse>("/queue/stop", {
        method: "POST",
      });

      console.log(result.message);
    });
}

function createRemoveCommand(): Command {
  return new Command("remove")
    .description("Remove a task from the queue by taskId")
    .argument("<taskId>", "task ID to remove")
    .option("--queue <type>", 'queue type: "install" or "download"', "install")
    .action(async (taskId: string, options: { queue: string }) => {
      if (options.queue !== "install" && options.queue !== "download") {
        fail(`Invalid queue type: ${options.queue}`);
      }

      const body: AstroBoxQueueRemoveRequest = {
        taskId,
        queue: options.queue as "install" | "download",
      };

      const result = await requestAstroBox<AstroBoxQueueRemoveResponse>("/queue/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log(result.message);
    });
}

export function createQueueCommand(): Command {
  const command = new Command("queue")
    .description("Manage install queue")
    .addCommand(createStatusCommand())
    .addCommand(createStartCommand())
    .addCommand(createStopCommand())
    .addCommand(createRemoveCommand())
    .addCommand(createInstallSubCommand());

  return command;
}
