import { Command } from "commander";

import { pathSegment, requestAstroBox } from "../lib/api";
import { fail } from "../lib/errors";
import type {
  AstroBoxProviderCategoriesResponse,
  AstroBoxProviderDownloadResponse,
  AstroBoxProviderItemDownload,
  AstroBoxProviderItemLink,
  AstroBoxProviderItemResponse,
  AstroBoxProviderListResponse,
  AstroBoxProviderManifest,
  AstroBoxProviderPageItem,
  AstroBoxProviderPageResponse,
  AstroBoxProviderRefreshRequest,
  AstroBoxProviderStateResponse,
  AstroBoxProviderTotalResponse,
} from "../types/astrobox";

function providerPath(providerId: string): string {
  return `/v2/providers/${pathSegment(providerId)}`;
}

function renderPageItem(item: AstroBoxProviderPageItem): string {
  const lines = [`[${item.restype}] ${item.name}`, `  id: ${item.id}`];
  if (item.description) lines.push(`  ${item.description}`);
  return lines.join("\n");
}

function createListCommand(): Command {
  return new Command("list")
    .description("List available providers")
    .action(async () => {
      const result = await requestAstroBox<AstroBoxProviderListResponse>("/v2/providers");
      console.log(result.providers.join("\n"));
    });
}

function createStateCommand(): Command {
  return new Command("state")
    .description("Get provider state")
    .argument("<name>", "provider name")
    .action(async (name: string) => {
      const result = await requestAstroBox<AstroBoxProviderStateResponse>(
        `${providerPath(name)}/state`,
      );
      console.log(result.state);
    });
}

function createCategoriesCommand(): Command {
  return new Command("categories")
    .description("Get provider category list")
    .argument("<name>", "provider name")
    .action(async (name: string) => {
      const result = await requestAstroBox<AstroBoxProviderCategoriesResponse>(
        `${providerPath(name)}/categories`,
      );
      console.log(result.categories.join("\n"));
    });
}

function createRefreshCommand(): Command {
  return new Command("refresh")
    .description("Refresh a provider")
    .argument("<name>", "provider name")
    .option("--cfg <cfg>", "provider configuration string", "")
    .action(async (name: string, options: { cfg: string }) => {
      console.log("Refreshing...");
      const body: AstroBoxProviderRefreshRequest = { cfg: options.cfg };
      await requestAstroBox<void>(`${providerPath(name)}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log(`Provider ${name} refreshed`);
    });
}

interface PageOptions {
  page: string;
  limit: string;
  keyword?: string;
  category?: string;
  sort: string;
}

function parsePositiveInt(value: string, flagName: string): number {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number < 1) {
    fail(`${flagName} must be an integer >= 1`);
  }
  return number;
}

function parsePaginationOptions(options: PageOptions): {
  inputPage: number;
  inputLimit: number;
  apiPage: number;
} {
  const inputPage = parsePositiveInt(options.page, "--page");
  const inputLimit = parsePositiveInt(options.limit, "--limit");
  return { inputPage, inputLimit, apiPage: inputPage - 1 };
}

function buildPageParams(apiPage: number, limit: number, options: PageOptions): URLSearchParams {
  const params = new URLSearchParams({
    page: String(apiPage),
    limit: String(limit),
    sort: options.sort,
  });
  if (options.keyword) params.set("keyword", options.keyword);
  if (options.category) params.set("category", options.category);
  return params;
}

function createPageCommand(): Command {
  return new Command("page")
    .description("Get provider paginated content")
    .argument("<name>", "provider name")
    .option("--page <page>", "page number (1-based)", "1")
    .option("--limit <limit>", "items per page", "20")
    .option("--keyword <keyword>", "search keyword")
    .option("--category <category>", "category filter (comma-separated)")
    .option("--sort <sort>", "sort by: time | name | random", "time")
    .action(async (name: string, options: PageOptions) => {
      const { inputPage, inputLimit, apiPage } = parsePaginationOptions(options);
      const params = buildPageParams(apiPage, inputLimit, options);
      const result = await requestAstroBox<AstroBoxProviderPageResponse>(
        `${providerPath(name)}/items?${params.toString()}`,
      );

      console.log(`Page ${inputPage} · ${result.items.length} items\n`);
      for (const item of result.items) console.log(renderPageItem(item));
    });
}

function formatAuthor(author: AstroBoxProviderPageItem["author"]): string | undefined {
  if (!author || author.length === 0) return undefined;
  if (typeof author[0] === "string") return (author as string[]).join(", ");
  return (author as Array<{ name: string }>).map((item) => item.name).join(", ");
}

function renderManifest(item: AstroBoxProviderPageItem): string {
  const lines = [`[${item.restype}] ${item.name}`];
  if (item.id) lines.push(`  id: ${item.id}`);
  if (item.description) lines.push(`  ${item.description}`);
  const author = formatAuthor(item.author);
  if (author) lines.push(`  author: ${author}`);
  return lines.join("\n");
}

function renderLinks(links: AstroBoxProviderItemLink[]): string {
  if (links.length === 0) return "";
  return ["", "Links:", ...links.map((link) => `  [${link.icon}] ${link.title}: ${link.url}`)].join(
    "\n",
  );
}

function renderDownloads(downloads: Record<string, AstroBoxProviderItemDownload>): string {
  const entries = Object.entries(downloads);
  if (entries.length === 0) return "";

  const lines = ["", "Downloads:"];
  for (const [key, download] of entries) {
    lines.push(`  ${download.display_name} (${key})`);
    lines.push(`    version: ${download.version}`);
    lines.push(`    file: ${download.file_name}`);
  }
  return lines.join("\n");
}

function renderProviderManifest(manifest: AstroBoxProviderManifest): string {
  return [
    renderManifest(manifest.item),
    renderLinks(manifest.links),
    renderDownloads(manifest.downloads),
  ]
    .filter(Boolean)
    .join("\n");
}

function createItemCommand(): Command {
  return new Command("item")
    .description("Get a specific item from a provider")
    .argument("<name>", "provider name")
    .argument("<id>", "item id")
    .action(async (name: string, id: string) => {
      const result = await requestAstroBox<AstroBoxProviderItemResponse>(
        `${providerPath(name)}/items/${pathSegment(id)}`,
      );
      console.log(renderProviderManifest(result.item));
    });
}

function createTotalCommand(): Command {
  return new Command("total")
    .description("Get total item count for a provider")
    .argument("<name>", "provider name")
    .action(async (name: string) => {
      const result = await requestAstroBox<AstroBoxProviderTotalResponse>(
        `${providerPath(name)}/total`,
      );
      console.log(result.total);
    });
}

function createDownloadCommand(): Command {
  return new Command("download")
    .description("Resolve download link for an item")
    .argument("<name>", "provider name")
    .requiredOption("--id <id>", "resource id")
    .option("--downloadKey <key>", "download entry key")
    .option("--device <device>", "provider device key (required for some OfficialV2 items)")
    .option("--trial", "trial download", false)
    .action(async (name: string, options: {
      id: string;
      downloadKey?: string;
      device?: string;
      trial: boolean;
    }) => {
      const params = new URLSearchParams({ trial: String(options.trial) });
      if (options.downloadKey) params.set("downloadKey", options.downloadKey);
      if (options.device) params.set("providerDeviceKey", options.device);

      const result = await requestAstroBox<AstroBoxProviderDownloadResponse>(
        `${providerPath(name)}/items/${pathSegment(options.id)}/download?${params.toString()}`,
      );
      const download = result.download;
      console.log(download.display_name);
      console.log(`  version: ${download.version}`);
      console.log(`  file:    ${download.file_name}`);
      console.log(`  url:     ${download.url ?? "-"}`);
    });
}

export function createProviderCommand(): Command {
  return new Command("provider")
    .description("Manage AstroBox providers")
    .addCommand(createListCommand())
    .addCommand(createStateCommand())
    .addCommand(createCategoriesCommand())
    .addCommand(createRefreshCommand())
    .addCommand(createPageCommand())
    .addCommand(createItemCommand())
    .addCommand(createTotalCommand())
    .addCommand(createDownloadCommand());
}
