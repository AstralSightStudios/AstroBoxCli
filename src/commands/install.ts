import { accessSync } from "node:fs";
import { resolve } from "node:path";

import { Command } from "commander";

import { requestAstroBox } from "../lib/api";
import { fail } from "../lib/errors";
import type { AstroBoxInstallResponse } from "../types/astrobox";

export function createInstallCommand(): Command {
  return new Command("install")
    .description("Install a local resource file through AstroBox")
    .argument("<path>", "path to the local resource file, resolved from the current working directory")
    .action(async (resourcePath: string) => {
      const normalizedPath = resolve(resourcePath);

      try {
        accessSync(normalizedPath);
      } catch {
        fail(`File does not exist: ${normalizedPath}`);
      }

      const result = await requestAstroBox<AstroBoxInstallResponse>("/resource/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          path: normalizedPath
        })
      });

      console.log(JSON.stringify(result, null, 2));
    });
}
