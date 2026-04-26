import type { AstroBoxQueueTaskItem } from "../types/astrobox";

export function renderQueueTable(items: AstroBoxQueueTaskItem[]): string {
  if (items.length === 0) {
    return "";
  }

  const columns = [
    { key: "name" as const, header: "Name", width: 20 },
    { key: "type" as const, header: "Type", width: 12 },
    { key: "progress" as const, header: "Progress", width: 10 },
    { key: "status" as const, header: "Status", width: 10 },
    { key: "progressDesc" as const, header: "Description", width: 20 },
  ];

  const pad = (s: unknown, w: number): string => {
    const safe = String(s ?? "");
    const str = safe.length > w ? safe.slice(0, w - 1) + "…" : safe;
    return str.padEnd(w, " ");
  };

  const headerLine = columns.map((c) => pad(c.header, c.width)).join(" | ");
  const separator = columns.map((c) => "-".repeat(c.width)).join("-+-");

  const rows = items.map((item) =>
    columns.map((c) => {
      const value = c.key === "progress" ? `${item[c.key]}%` : item[c.key];
      return pad(value, c.width);
    }).join(" | ")
  );

  return [headerLine, separator, ...rows].join("\n");
}
