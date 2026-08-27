import { accessSync, readFileSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";

import {
  getAstroBoxApiVersion,
  pathSegment,
  requestAstroBox,
  requestAstroBoxPublic,
} from "./api";
import {
  normalizeLegacyInstall,
  normalizeLegacyQueueStatus,
  type LegacyInstallResponse,
  type LegacyQueueStatusResponse,
} from "./compat";
import { resolveDeviceId } from "./device";
import { fail } from "./errors";
import { renderQueueTable } from "./table";
import type {
  AstroBoxInstallRequest,
  AstroBoxInstallResponse,
  AstroBoxQueueTask,
  AstroBoxQueueTaskResponse,
  AstroBoxUploadResponse,
} from "../types/astrobox";

export type InstallOptions = {
  resourceType?: string;
  watchfaceId?: string;
};

function validateFile(resourcePath: string): string {
  const normalizedPath = resolve(resourcePath);
  try {
    accessSync(normalizedPath);
    if (!statSync(normalizedPath).isFile()) {
      fail(`Not a regular file: ${normalizedPath}`);
    }
  } catch {
    fail(`File does not exist: ${normalizedPath}`);
  }
  return normalizedPath;
}

async function uploadFile(normalizedPath: string): Promise<AstroBoxUploadResponse> {
  const form = new FormData();
  const file = new Blob([readFileSync(normalizedPath) as unknown as ArrayBuffer], {
    type: "application/octet-stream",
  });
  form.append("file", file, basename(normalizedPath));

  return requestAstroBox<AstroBoxUploadResponse>("/v2/uploads", {
    method: "POST",
    body: form,
  });
}

async function removeUpload(uploadId: string): Promise<void> {
  try {
    await requestAstroBox<void>(`/v2/uploads/${pathSegment(uploadId)}`, {
      method: "DELETE",
    });
  } catch {
    // The original error is more useful than a best-effort cleanup failure.
  }
}

async function queueInstall(
  deviceId: string,
  uploadId: string,
  options: InstallOptions,
): Promise<AstroBoxInstallResponse> {
  const body: AstroBoxInstallRequest = {
    deviceId,
    uploadId,
  };
  if (options.resourceType) body.resourceType = options.resourceType;
  if (options.watchfaceId) body.watchfaceId = options.watchfaceId;

  try {
    return await requestAstroBox<AstroBoxInstallResponse>("/v2/queue/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    await removeUpload(uploadId);
    throw error;
  }
}

function clearPreviousOutput(previousOutput: string): void {
  const lines = previousOutput.split("\n").length;
  process.stdout.write(`\x1B[2K\r${"\x1B[1A\x1B[2K\r".repeat(lines - 1)}`);
}

function cleanupOutput(output: string): void {
  if (output) clearPreviousOutput(output);
}

function taskErrorMessage(task: AstroBoxQueueTask): string | undefined {
  if (task.status !== "failed" && task.status !== "canceled") return undefined;
  return (
    task.errorDetail ??
    task.progressDesc ??
    task.errorCode ??
    `task ${task.status}`
  );
}

function isTaskComplete(task: AstroBoxQueueTask): boolean {
  return task.status === "succeeded";
}

function renderProgress(task: AstroBoxQueueTask, previousOutput: string): string {
  const output = [
    `Install progress: ${Math.round(task.progress * 100)}%`,
    `Device: ${task.deviceId}`,
    renderQueueTable([task]),
  ].join("\n");

  if (previousOutput) clearPreviousOutput(previousOutput);
  process.stdout.write(output);
  return output;
}

async function pollOnce(taskId: string, previousOutput: string): Promise<string | null> {
  const task = await requestAstroBox<AstroBoxQueueTaskResponse>(
    `/v2/queue/tasks/${pathSegment(taskId)}`,
  );
  const errorMessage = taskErrorMessage(task);
  if (errorMessage) {
    cleanupOutput(previousOutput);
    fail(`Install error: ${errorMessage}`);
  }

  if (isTaskComplete(task)) {
    cleanupOutput(previousOutput);
    console.log("Installation completed successfully.");
    return null;
  }

  return renderProgress(task, previousOutput);
}

async function pollUntilComplete(
  taskId: string,
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<boolean> {
  const startTime = Date.now();
  let previousOutput = "";

  while (Date.now() - startTime < timeoutMs) {
    const nextOutput = await pollOnce(taskId, previousOutput);
    if (nextOutput === null) return true;
    previousOutput = nextOutput;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, pollIntervalMs));
  }

  return false;
}

async function queueInstallLegacy(normalizedPath: string): Promise<string> {
  const response = await requestAstroBoxPublic<LegacyInstallResponse>("/queue/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: normalizedPath }),
  });
  return normalizeLegacyInstall(response).taskId;
}

async function pollLegacyOnce(taskId: string, previousOutput: string): Promise<string | null> {
  const response = await requestAstroBoxPublic<LegacyQueueStatusResponse>("/queue/status");
  const queue = normalizeLegacyQueueStatus(response);
  const task = queue.devices
    .flatMap((deviceQueue) => deviceQueue.items)
    .find((item) => item.taskId === taskId);

  if (!task || task.status === "succeeded") {
    cleanupOutput(previousOutput);
    console.log("Installation completed successfully.");
    return null;
  }

  const errorMessage = taskErrorMessage(task);
  if (errorMessage) {
    cleanupOutput(previousOutput);
    fail(`Install error: ${errorMessage}`);
  }

  return renderProgress(task, previousOutput);
}

async function pollLegacyUntilComplete(
  taskId: string,
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<boolean> {
  const startTime = Date.now();
  let previousOutput = "";

  while (Date.now() - startTime < timeoutMs) {
    const nextOutput = await pollLegacyOnce(taskId, previousOutput);
    if (nextOutput === null) return true;
    previousOutput = nextOutput;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, pollIntervalMs));
  }

  return false;
}

async function installFileLegacy(
  normalizedPath: string,
  deviceId: string | undefined,
  wait: boolean,
  options: InstallOptions,
): Promise<void> {
  if (deviceId) {
    fail("The legacy AstroBox API does not support selecting an install device.");
  }
  if (options.resourceType || options.watchfaceId) {
    fail("The legacy AstroBox API does not support resource install options.");
  }

  const taskId = await queueInstallLegacy(normalizedPath);
  if (!wait) {
    console.log(`Installation queued: ${taskId}`);
    return;
  }

  console.log("Waiting for installation to complete...");
  const completed = await pollLegacyUntilComplete(taskId, 10 * 60 * 1000, 1000);
  if (!completed) fail("Installation timed out");
}

export async function installFile(
  resourcePath: string,
  deviceId: string | undefined,
  wait: boolean,
  options: InstallOptions = {},
): Promise<void> {
  const normalizedPath = validateFile(resourcePath);
  if ((await getAstroBoxApiVersion()) === "legacy") {
    await installFileLegacy(normalizedPath, deviceId, wait, options);
    return;
  }

  const targetDeviceId = await resolveDeviceId(deviceId);
  const upload = await uploadFile(normalizedPath);
  const result = await queueInstall(targetDeviceId, upload.uploadId, options);

  if (!result.taskId) {
    await removeUpload(upload.uploadId);
    fail("Installation did not return a task ID");
  }

  if (!wait) {
    console.log(`Installation queued: ${result.taskId}`);
    return;
  }

  console.log("Waiting for installation to complete...");
  const completed = await pollUntilComplete(result.taskId, 10 * 60 * 1000, 1000);
  if (!completed) fail("Installation timed out");
}
