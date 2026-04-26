import { accessSync } from "node:fs";
import { resolve } from "node:path";

import { requestAstroBox } from "./api";
import { fail } from "./errors";
import { renderQueueTable } from "./table";
import type { AstroBoxInstallResponse, AstroBoxQueueStatusResponse } from "../types/astrobox";

export async function installFile(resourcePath: string, wait: boolean): Promise<void> {
  const normalizedPath = resolve(resourcePath);

  try {
    accessSync(normalizedPath);
  } catch {
    fail(`File does not exist: ${normalizedPath}`);
  }

  const result = await requestAstroBox<AstroBoxInstallResponse>("/queue/install", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: normalizedPath,
    }),
  });

  if (!result.ok) {
    fail(`Installation failed: ${result.message}`);
  }

  if (!wait) {
    console.log(`Installation queued: ${result.taskId}`);
    return;
  }

  console.log("Waiting for installation to complete...");

  const pollIntervalMs = 1000;
  const timeoutMs = 10000;
  const startTime = Date.now();
  let previousOutput = "";

  while (Date.now() - startTime < timeoutMs) {
    const queue = await requestAstroBox<AstroBoxQueueStatusResponse>("/queue/status", {
      method: "GET",
    });

    if (!queue.ok) {
      fail(`Queue status check failed: ${(queue as Record<string, unknown>).message ?? "unknown error"}`);
    }

    const errorItem = queue.install.items.find((item) => item.status === "error");
    if (errorItem) {
      if (previousOutput) {
        process.stdout.write("\x1B[2K\r");
      }
      fail(`Install error: ${errorItem.progressDesc}`);
    }

    if (queue.install.items.length === 0) {
      if (previousOutput) {
        process.stdout.write("\x1B[2K\r");
      }
      console.log("Installation completed successfully.");
      return;
    }

    const table = renderQueueTable(queue.install.items);
    const output = `Install progress: ${queue.install.progress}%\n${table}`;

    if (previousOutput) {
      const lines = previousOutput.split("\n").length;
      process.stdout.write(`\x1B[2K\r${"\x1B[1A\x1B[2K\r".repeat(lines - 1)}`);
    }

    process.stdout.write(output);
    previousOutput = output;

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  fail("Installation timed out");
}
