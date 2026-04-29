const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" }
});


const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://ahrazrafiq28_db_user:Rbw2w3K2ONltWxau@cluster0.jcv2psq.mongodb.net/?appName=Cluster0");

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB Connected");
});

// MQTT CONFIG
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

client.on("message", (topic, message) => {
  const data = message.toString();
  console.log("📩 MQTT DATA:", data);

  io.emit("data", data);
});

// Serve frontend
app.use(express.static("public"));

const PORT = 3000;

server.listen(PORT, () => {
  console.log("🚀 Dashboard running at http://localhost:3000");
});
