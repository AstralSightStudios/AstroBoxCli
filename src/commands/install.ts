import { Command } from "commander";

import { installFile } from "../lib/install";

export function createInstallCommand(): Command {
  return new Command("install")
    .description("Upload and install a local resource")
    .argument("<path>", "path to the local resource file, resolved from the current working directory")
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
