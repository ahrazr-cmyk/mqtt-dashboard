const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MQTT CONFIG
const client = mqtt.connect("mqtts://f1108f1ecd8140f98e0b481a54f10251.s1.eu.hivemq.cloud:8883", {
    username: "esp32",
    password: "Esp1234567"
});

client.on("connect", () => {
    console.log("✅ MQTT Connected");
    client.subscribe("vehicle/data");
});

client.on("message", (topic, message) => {
    const data = message.toString();
    console.log("📩 Received:", data);
    io.emit("data", data);
});

// Serve frontend
app.use(express.static("public"));

// IMPORTANT for Railway/Render
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("🚀 Dashboard running on port", PORT);
});
