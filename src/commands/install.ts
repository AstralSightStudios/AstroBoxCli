import { Command } from "commander";

import { installFile } from "../lib/install";

export function createInstallCommand(): Command {
  return new Command("install")
    .description("Install a local resource file through AstroBox")
    .argument("<path>", "path to the local resource file, resolved from the current working directory")
    .option("--wait", "wait for installation to complete and show progress")
    .action(async (resourcePath: string, options: { wait?: boolean }) => {
      await installFile(resourcePath, options.wait ?? false);
    });
}
