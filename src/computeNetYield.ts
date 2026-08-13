import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface Row {
  aum: number;
  dailyYieldPct: number;
  date: string;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && content[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

function parseNumber(raw: string): number {
  if (raw === "") return 0;
  return Number(raw.replace(/,/g, ""));
}

function main() {
  const inputPath = join(process.cwd(), "buidl_missing_data.csv");
  const outputPath = join(process.cwd(), "buidl_net_yield.csv");

  const content = readFileSync(inputPath, "utf-8");
  const [header, ...records] = parseCsv(content);

  const aumIdx = header.indexOf("aum");
  const yieldIdx = header.indexOf("daily_yield_pct");
  const dateIdx = header.indexOf("date");

  const rows: Row[] = records.map((r) => ({
    aum: parseNumber(r[aumIdx]),
    dailyYieldPct: parseNumber(r[yieldIdx]),
    date: r[dateIdx],
  }));

  const aumSumByDate = new Map<string, number>();
  for (const row of rows) {
    aumSumByDate.set(row.date, (aumSumByDate.get(row.date) ?? 0) + row.aum);
  }

  const netYieldSumByDate = new Map<string, number>();
  for (const row of rows) {
    const dayAumSum = aumSumByDate.get(row.date) ?? 0;
    const netYield = dayAumSum === 0 ? 0 : (row.dailyYieldPct * row.aum) / dayAumSum;
    netYieldSumByDate.set(row.date, (netYieldSumByDate.get(row.date) ?? 0) + netYield);
  }

  const sortedDates = [...netYieldSumByDate.keys()].sort();
  const lines = ["date,net_yield", ...sortedDates.map((date) => `${date},${netYieldSumByDate.get(date)}`)];

  writeFileSync(outputPath, lines.join("\n") + "\n", "utf-8");
  console.log(`Wrote ${sortedDates.length} rows to ${outputPath}`);
}

main();
