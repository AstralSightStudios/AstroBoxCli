import { accessSync } from "node:fs";
import { resolve } from "node:path";

import { requestAstroBox } from "./api";
import { fail } from "./errors";
import { renderQueueTable } from "./table";
import type { AstroBoxInstallResponse, AstroBoxQueueStatusResponse } from "../types/astrobox";

function validateFile(resourcePath: string): string {
  const normalizedPath = resolve(resourcePath);
  try {
    accessSync(normalizedPath);
  } catch {
    fail(`File does not exist: ${normalizedPath}`);
  }
  return normalizedPath;
}

async function queueInstall(normalizedPath: string): Promise<string> {
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

  return result.taskId;
}

function clearPreviousOutput(previousOutput: string): void {
  const lines = previousOutput.split("\n").length;
  process.stdout.write(`\x1B[2K\r${"\x1B[1A\x1B[2K\r".repeat(lines - 1)}`);
}

function cleanupOutput(output: string): void {
  if (output) {
    clearPreviousOutput(output);
  }
}

function getQueueErrorMessage(queue: AstroBoxQueueStatusResponse): string | undefined {
  if (!queue.ok) {
    return `Queue status check failed: ${(queue as Record<string, unknown>).message ?? "unknown error"}`;
  }
  const errorItem = queue.install.items.find((item) => item.status === "error");
  if (errorItem) {
    return `Install error: ${errorItem.progressDesc}`;
  }
  return undefined;
}

function isQueueComplete(queue: AstroBoxQueueStatusResponse): boolean {
  return queue.install.items.length === 0;
}

function renderProgress(
  queue: AstroBoxQueueStatusResponse,
  previousOutput: string
): string {
  const table = renderQueueTable(queue.install.items);
  const output = `Install progress: ${queue.install.progress}%\n${table}`;

  if (previousOutput) {
    clearPreviousOutput(previousOutput);
  }

  process.stdout.write(output);
  return output;
}

async function pollOnce(previousOutput: string): Promise<string | null> {
  const queue = await requestAstroBox<AstroBoxQueueStatusResponse>("/queue/status", {
    method: "GET",
  });

  const errorMsg = getQueueErrorMessage(queue);
  if (errorMsg) {
    cleanupOutput(previousOutput);
    fail(errorMsg);
  }

  if (isQueueComplete(queue)) {
    cleanupOutput(previousOutput);
    console.log("Installation completed successfully.");
    return null;
  }

  return renderProgress(queue, previousOutput);
}

async function pollUntilComplete(
  timeoutMs: number,
  pollIntervalMs: number
): Promise<boolean> {
  const startTime = Date.now();
  let previousOutput = "";

  while (Date.now() - startTime < timeoutMs) {
    const nextOutput = await pollOnce(previousOutput);
    if (nextOutput === null) {
      return true;
    }
    previousOutput = nextOutput;
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  return false;
}

export async function installFile(resourcePath: string, wait: boolean): Promise<void> {
  const normalizedPath = validateFile(resourcePath);
  const taskId = await queueInstall(normalizedPath);

  if (!wait) {
    console.log(`Installation queued: ${taskId}`);
    return;
  }

  console.log("Waiting for installation to complete...");

  const completed = await pollUntilComplete(10000, 1000);
  if (!completed) {
    fail("Installation timed out");
  }
}
