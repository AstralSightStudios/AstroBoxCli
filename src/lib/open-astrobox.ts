import { spawn } from "node:child_process";

export function openAstroBox(url: string): Promise<void> {
  if (!url) url = "astrobox://open";
  return new Promise((resolve, reject) => {
    let command = "";
    let args: string[] = [];

    if (process.platform === "darwin") {
      command = "open";
      args = [url];
    } else if (process.platform === "win32") {
      command = "cmd";
      args = ["/c", "start", "", url];
    } else {
      command = "xdg-open";
      args = [url];
    }

    const child = spawn(command, args, {
      stdio: "ignore",
      detached: process.platform !== "win32",
    });

    child.on("error", reject);
    child.on("spawn", () => {
      child.unref();
      resolve();
    });
  });
}
