const axios = require("axios");
const prisma = require("../prisma");

const MOCK_BSE_URL =
    process.env.MOCK_BSE_URL || "http://localhost:5001";

async function executePull(jobId, io) {
    try {
        console.log(`Starting background pull: ${jobId}`);

        // Mark job as RUNNING
        await prisma.pullJob.update({
            where: {
                id: jobId
            },
            data: {
                status: "RUNNING",
                startedAt: new Date()
            }
        });

        console.log("Calling Mock BSE API...");

        // Call Mock BSE API
        const response = await axios.get(
            `${MOCK_BSE_URL}/getTrades`,
            {
                timeout: 25 * 60 * 1000
            }
        );

        const trades = response.data;

        console.log(`Received ${trades.length} trades`);

        // Insert/update trades
        for (const trade of trades) {
            await prisma.trade.upsert({
                where: {
                    tradeId: trade.tradeId
                },

                update: {
                    client: trade.client,
                    symbol: trade.symbol,
                    quantity: trade.quantity,
                    price: trade.price,
                    timestamp: new Date(trade.timestamp)
                },

                create: {
                    tradeId: trade.tradeId,
                    client: trade.client,
                    symbol: trade.symbol,
                    quantity: trade.quantity,
                    price: trade.price,
                    timestamp: new Date(trade.timestamp)
                }
            });
        }

        // Mark job completed
        const completedJob = await prisma.pullJob.update({
            where: {
                id: jobId
            },

            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                recordsFetched: trades.length
            }
        });

        console.log(
            `Pull ${jobId} completed successfully`
        );

        // Notify dashboard safely
        if (io) {
            io.emit("pull-completed", {
                jobId: completedJob.id,
                recordsFetched: completedJob.recordsFetched
            });

            io.emit("trades-updated");
        }

    } catch (error) {

        console.error(
            `Pull ${jobId} failed:`,
            error.message
        );

        try {
            await prisma.pullJob.update({
                where: {
                    id: jobId
                },

                data: {
                    status: "FAILED",
                    error: error.message,
                    completedAt: new Date()
                }
            });
        } catch (dbError) {
            console.error(
                "Failed to update pull job:",
                dbError.message
            );
        }

        if (io) {
            io.emit("pull-failed", {
                jobId,
                error: error.message
            });
        }
    }
}

module.exports = {
    executePull
};