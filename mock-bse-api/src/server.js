const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const BSE_DELAY_MS = Number(process.env.BSE_DELAY_MS || 10000);

// --------------------------------------------------
// Seeded trade data
// --------------------------------------------------

const symbols = [
    "RELIANCE",
    "TCS",
    "INFY",
    "HDFCBANK",
    "ICICIBANK",
    "SBIN",
    "ITC",
    "LT",
    "AXISBANK",
    "BHARTIARTL"
];

const trades = [];

for (let i = 1; i <= 3000; i++) {
    const symbol = symbols[(i - 1) % symbols.length];

    trades.push({
        tradeId: `TRD${String(i).padStart(6, "0")}`,
        client: `CLIENT${String(((i - 1) % 500) + 1).padStart(4, "0")}`,
        symbol: symbol,
        quantity: ((i % 20) + 1) * 10,
        price: Number((1000 + ((i * 37.5) % 3000)).toFixed(2)),
        timestamp: new Date(
            Date.now() - (3000 - i) * 1000
        ).toISOString()
    });
}

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/", (req, res) => {
    res.json({
        service: "Mock BSE API",
        status: "running",
        totalTrades: trades.length
    });
});

// --------------------------------------------------
// GET /getTrades
// --------------------------------------------------

app.get("/getTrades", async (req, res) => {
    console.log(
        `BSE pull started. Simulating ${BSE_DELAY_MS / 1000} seconds delay...`
    );

    await new Promise((resolve) => {
        setTimeout(resolve, BSE_DELAY_MS);
    });

    console.log("BSE pull completed.");

    res.json(trades);
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
    console.log(`Mock BSE API running on http://localhost:${PORT}`);
    console.log(`Seeded trades: ${trades.length}`);
    console.log(`Configured delay: ${BSE_DELAY_MS / 1000} seconds`);
});