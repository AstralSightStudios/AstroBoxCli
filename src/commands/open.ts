import { Command } from "commander";

import { ASTROBOX_PROTOCOL_URL } from "../lib/constants";
import { fail } from "../lib/errors";
import { openAstroBox } from "../lib/open-astrobox";

export function createOpenCommand(): Command {
  return new Command("open")
    .description("Launch AstroBox via astrobox:// protocol")
    .option("--url <url>", "custom AstroBox protocol url", ASTROBOX_PROTOCOL_URL)
    .action(async (options: { url: string }) => {
      try {
        await openAstroBox(options.url);
        console.log(`Opened ${options.url}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        fail(`Failed to open AstroBox protocol URL. ${message}`);
      }
    });
}
