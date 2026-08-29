require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const pullRoutes = require("./routes/pullRoutes");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.set("io", io);

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {

    res.json({
        service: "BSE Trade Backend",
        status: "running"
    });

});

// API routes
app.use("/api", pullRoutes);

// Socket.IO
io.on("connection", (socket) => {

    console.log(
        `Dashboard connected: ${socket.id}`
    );

    socket.on("disconnect", () => {

        console.log(
            `Dashboard disconnected: ${socket.id}`
        );

    });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(
        `Backend running on http://localhost:${PORT}`
    );

});