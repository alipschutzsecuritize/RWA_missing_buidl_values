# RWA Missing BUIDL Values

Scripts to backfill and report BlackRock BUIDL net yield metrics from `buidl_missing_data.csv`.

## Scripts

### `npm run compute-net-yield`

Reads `buidl_missing_data.csv` and, for each date, computes:

```
net_yield = daily_yield_pct * aum / sum(aum for that date)
```

then sums `net_yield` across all rows for each date. Writes the result to `buidl_net_yield.csv` with columns `date,net_yield`.

Rows with `aum = 0` (and therefore empty `daily_yield_pct`) contribute `0` to the sum.

### `npm run send-net-yield`

Reads `values_to_send.csv` (columns `date,net_yield`) and, for each row, sends a `PUT` request to the rwa.xyz ingestion API at `https://ingestion-api.rwa.xyz/v1/assets/metrics/{date}` with body:

```json
[
  {
    "id": "BUIDL",
    "metrics": {
      "net_asset_value": 1,
      "net_yield_1d_rate": <net_yield>
    }
  }
]
```

## Setup

```bash
npm install
```

Create a `.env` file with the ingestion API token:

```
RWA_API_TOKEN=<token>
```
