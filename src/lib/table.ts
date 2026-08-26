import type { AstroBoxQueueTask } from "../types/astrobox";

export function renderQueueTable(items: AstroBoxQueueTask[]): string {
  if (items.length === 0) {
    return "";
  }

  const columns = [
    { key: "name" as const, header: "Name", width: 20 },
    { key: "resourceType" as const, header: "Type", width: 12 },
    { key: "progress" as const, header: "Progress", width: 10 },
    { key: "status" as const, header: "Status", width: 16 },
    { key: "progressDesc" as const, header: "Description", width: 24 },
  ];

  const pad = (value: unknown, width: number): string => {
    const safe = String(value ?? "");
    const text = safe.length > width ? `${safe.slice(0, width - 1)}…` : safe;
    return text.padEnd(width, " ");
  };

  const headerLine = columns.map((column) => pad(column.header, column.width)).join(" | ");
  const separator = columns.map((column) => "-".repeat(column.width)).join("-+-");
  const rows = items.map((item) =>
    columns
      .map((column) => {
        const value =
          column.key === "progress"
            ? `${Math.round(item.progress * 100)}%`
            : item[column.key];
        return pad(value, column.width);
      })
      .join(" | "),
  );

  return [headerLine, separator, ...rows].join("\n");
}
