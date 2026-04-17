import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

import { createDeviceCommand } from "./commands/device";
import { createInstallCommand } from "./commands/install";
import { createOpenCommand } from "./commands/open";
import { createStatusCommand } from "./commands/status";
import { fail } from "./lib/errors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  version: string;
};

const program = new Command();

program
  .name("astrobox")
  .description("AstroBox CLI")
  .version(packageJson.version, "-v, --version", "display the current version")
  .addCommand(createOpenCommand())
  .addCommand(createStatusCommand())
  .addCommand(createInstallCommand())
  .addCommand(createDeviceCommand());

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
});
