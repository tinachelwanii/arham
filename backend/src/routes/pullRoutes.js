const express = require("express");
const prisma = require("../prisma");
const { executePull } = require("../services/pullService");

const router = express.Router();

// =====================================================
// POST /api/pull
// Start a new BSE trade pull
// =====================================================

router.post("/pull", async (req, res) => {
    try {
        // Create a pending job
        const job = await prisma.pullJob.create({
            data: {
                status: "PENDING"
            }
        });

        // Start background pull
        // IMPORTANT: Do NOT await this.
        // This allows the API to immediately return 202.
        executePull(
            job.id,
            req.app.get("io")
        ).catch((error) => {
            console.error(
                "Background pull error:",
                error
            );
        });

        // Immediately return HTTP 202
        res.status(202).json({
            message: "Trade pull started",
            jobId: job.id,
            status: "PENDING"
        });

    } catch (error) {
        console.error(
            "Failed to start pull:",
            error
        );

        res.status(500).json({
            message: "Failed to start trade pull"
        });
    }
});


// =====================================================
// GET /api/trades
//
// Examples:
// GET /api/trades?limit=100
//      -> latest 100 trades
//
// GET /api/trades?limit=3000
//      -> latest 3000 trades
//
// GET /api/trades
//      -> ALL trades
// =====================================================

router.get("/trades", async (req, res) => {
    try {
        let trades;

        // If limit is provided, use it
        if (req.query.limit) {

            const limit = parseInt(
                req.query.limit,
                10
            );

            // Validate limit
            if (
                Number.isNaN(limit) ||
                limit <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid limit"
                });
            }

            trades = await prisma.trade.findMany({
                orderBy: {
                    timestamp: "desc"
                },
                take: limit
            });

        } else {

            // No limit = return all trades
            trades = await prisma.trade.findMany({
                orderBy: {
                    timestamp: "desc"
                }
            });
        }

        res.json(trades);

    } catch (error) {
        console.error(
            "Failed to fetch trades:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch trades"
        });
    }
});


// =====================================================
// GET /api/jobs
// Get latest 20 pull jobs
// =====================================================

router.get("/jobs", async (req, res) => {
    try {
        const jobs = await prisma.pullJob.findMany({
            orderBy: {
                createdAt: "desc"
            },
            take: 20
        });

        res.json(jobs);

    } catch (error) {
        console.error(
            "Failed to fetch jobs:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch pull jobs"
        });
    }
});


// =====================================================
// GET /api/:jobId/status
// Get status of a specific pull
// =====================================================

router.get("/:jobId/status", async (req, res) => {
    try {
        const job = await prisma.pullJob.findUnique({
            where: {
                id: req.params.jobId
            }
        });

        if (!job) {
            return res.status(404).json({
                message: "Pull job not found"
            });
        }

        res.json({
            jobId: job.id,
            status: job.status,
            recordsFetched: job.recordsFetched,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            error: job.error
        });

    } catch (error) {
        console.error(
            "Failed to fetch pull status:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch pull status"
        });
    }
});


module.exports = router;
