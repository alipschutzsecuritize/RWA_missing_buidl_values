import { readFileSync } from "node:fs";
import { join } from "node:path";

process.loadEnvFile(join(process.cwd(), ".env"));

const ASSET_ID = "BUIDL";
const API_BASE_URL = "https://ingestion-api.rwa.xyz/v1/assets/metrics";

interface Row {
  date: string;
  netYield: number;
}

function parseCsv(content: string): Row[] {
  const lines = content.trim().split("\n");
  const [, ...records] = lines;
  return records.map((line) => {
    const [date, netYield] = line.split(",");
    return { date, netYield: Number(netYield) };
  });
}

async function sendMetric(row: Row, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${row.date}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify([
      {
        id: ASSET_ID,
        metrics: {
          net_asset_value: 1,
          net_yield_1d_rate: row.netYield,
        },
      },
    ]),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PUT ${row.date} failed: ${response.status} ${body}`);
  }
}

async function main() {
  const token = process.env.RWA_API_TOKEN;
  if (!token) {
    throw new Error("RWA_API_TOKEN is not set. Create a .env file with RWA_API_TOKEN=<token>.");
  }

  const inputPath = join(process.cwd(), "values_to_send.csv");
  const rows = parseCsv(readFileSync(inputPath, "utf-8"));

  for (const row of rows) {
    await sendMetric(row, token);
    console.log(`Sent ${row.date}: net_yield_1d_rate=${row.netYield}`);
  }

  console.log(`Done. Sent ${rows.length} rows.`);
}

main();
