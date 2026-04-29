const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" }
});

// ─────────────────────────────
// MQTT CONFIG
// ─────────────────────────────
const client = mqtt.connect({
  host: "f1108f1ecd8140f98e0b481a54f10251.s1.eu.hivemq.cloud",
  port: 8883,
  protocol: "mqtts",
  username: "esp32",
  password: "Esp1234567",
  rejectUnauthorized: false
});

client.on("connect", () => {
  console.log("✅ MQTT Connected");
  client.subscribe("vehicle/data");
});

// ─────────────────────────────
// RECEIVE DATA
// ─────────────────────────────
client.on("message", (topic, message) => {
  const data = message.toString();
  console.log("📩 MQTT DATA:", data);

  // Send to dashboard
  io.emit("data", data);
});

// ─────────────────────────────
// SERVE FRONTEND
// ─────────────────────────────
app.use(express.static("public"));

// ─────────────────────────────
// START SERVER
// ─────────────────────────────
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Dashboard running on port ${PORT}`);
});
