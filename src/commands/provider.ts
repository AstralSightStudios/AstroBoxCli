import { Command } from "commander";

import { requestAstroBox } from "../lib/api";
import type {
  AstroBoxProviderCategoriesResponse,
  AstroBoxProviderItemResponse,
  AstroBoxProviderListResponse,
  AstroBoxProviderPageItem,
  AstroBoxProviderPageResponse,
  AstroBoxProviderRefreshRequest,
  AstroBoxProviderStateResponse,
  AstroBoxProviderTotalResponse,
} from "../types/astrobox";

function renderPageItem(item: AstroBoxProviderPageItem): string {
  const lines = [`[${item.restype}] ${item.name}`, `  id: ${item.id}`];
  if (item.description) {
    lines.push(`  ${item.description}`);
  }
  return lines.join("\n");
}

function createListCommand(): Command {
  return new Command("list")
    .description("List available providers")
    .action(async () => {
      const result = await requestAstroBox<AstroBoxProviderListResponse>("/provider/list");
      console.log(result.providers.join("\n"));
    });
}

function createStateCommand(): Command {
  return new Command("state")
    .description("Get provider state")
    .argument("<name>", "provider name")
    .action(async (name: string) => {
      const result = await requestAstroBox<AstroBoxProviderStateResponse>(`/provider/${name}/state`);
      console.log(result.state);
    });
}

function createCategoriesCommand(): Command {
  return new Command("categories")
    .description("Get provider category list")
    .argument("<name>", "provider name")
    .action(async (name: string) => {
      const result = await requestAstroBox<AstroBoxProviderCategoriesResponse>(`/provider/${name}/categories`);
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

      const body: AstroBoxProviderRefreshRequest = {
        cfg: options.cfg,
      };

      await requestAstroBox<{ ok: boolean }>(`/provider/${name}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log(`Provider ${name} refreshed`);
    });
}

function createPageCommand(): Command {
  return new Command("page")
    .description("Get provider paginated content")
    .argument("<name>", "provider name")
    .option("--page <page>", "page number", "1")
    .option("--limit <limit>", "items per page", "20")
    .option("--keyword <keyword>", "search keyword")
    .option("--category <category>", "category filter (comma-separated)")
    .option("--sort <sort>", "sort by: time | name | random", "time")
    .action(async (name: string, options: {
      page: string;
      limit: string;
      keyword?: string;
      category?: string;
      sort: string;
    }) => {
      const params = new URLSearchParams();
      params.append("page", options.page);
      params.append("limit", options.limit);
      if (options.keyword) params.append("keyword", options.keyword);
      if (options.category) params.append("category", options.category);
      params.append("sort", options.sort);

      const result = await requestAstroBox<AstroBoxProviderPageResponse>(
        `/provider/${name}/page?${params.toString()}`
      );

      console.log(`Page ${result.page} · ${result.items.length} items\n`);
      for (const item of result.items) {
        console.log(renderPageItem(item));
      }
    });
}

function renderProviderItem(item: AstroBoxProviderPageItem): string {
  const lines: string[] = [];

  lines.push(`[${item.restype}] ${item.name}`);
  lines.push(`  id: ${item.id}`);

  if (item.description) {
    lines.push(`  ${item.description}`);
  }

  if (item.author && item.author.length > 0) {
    lines.push(`  author: ${item.author.join(", ")}`);
  }

  if (item.icon) {
    lines.push(`  icon: ${item.icon}`);
  }

  if (item.cover) {
    lines.push(`  cover: ${item.cover}`);
  }

  if (item.preview && item.preview.length > 0) {
    lines.push(`  preview: ${item.preview.join(", ")}`);
  }

  return lines.join("\n");
}

function createItemCommand(): Command {
  return new Command("item")
    .description("Get a specific item from a provider")
    .argument("<name>", "provider name")
    .argument("<id>", "item id")
    .action(async (name: string, id: string) => {
      const result = await requestAstroBox<AstroBoxProviderItemResponse>(`/provider/${name}/item/${id}`);
      console.log(renderProviderItem(result.item as AstroBoxProviderPageItem));
    });
}

function createTotalCommand(): Command {
  return new Command("total")
    .description("Get total item count for a provider")
    .argument("<name>", "provider name")
    .action(async (name: string) => {
      const result = await requestAstroBox<AstroBoxProviderTotalResponse>(`/provider/${name}/total`);
      console.log(result.total);
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
    .addCommand(createTotalCommand());
}
