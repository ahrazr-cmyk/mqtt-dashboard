const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" }
});

// ─────────────────────────────────────
// ✅ MONGODB CONNECTION (FIXED)
// ─────────────────────────────────────

// 👉 BEST PRACTICE: use Railway ENV variable
// const MONGO_URI = process.env.MONGO_URI;

// 👉 TEMP (your current string)
const MONGO_URI = "mongodb+srv://ahrazrafiq28_db_user:Rbw2w3K2ONltWxau@cluster0.jcv2psq.mongodb.net/iotdb";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err.message));


// ─────────────────────────────────────
// ✅ SCHEMA
// ─────────────────────────────────────
const logSchema = new mongoose.Schema({
  state: String,
  speed: Number,
  sats: Number,
  lat: Number,
  lng: Number,
  ax: Number,
  ay: Number,
  az: Number,
  mag: Number,
  timestamp: { type: Date, default: Date.now }
});

const Log = mongoose.model("Log", logSchema);


// ─────────────────────────────────────
// MQTT CONFIG (UNCHANGED)
// ─────────────────────────────────────
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


// ─────────────────────────────────────
// RECEIVE DATA
// ─────────────────────────────────────
client.on("message", async (topic, message) => {
  const dataStr = message.toString();
  console.log("📩 MQTT DATA:", dataStr);

  // Send to dashboard
  io.emit("data", dataStr);

  try {
    const data = JSON.parse(dataStr);

    // ✅ SAVE ONLY EVENTS (better performance)
    if (data.state && data.state !== "NORMAL") {
      await Log.create(data);
      console.log("💾 Saved to DB:", data.state);
    }

  } catch (err) {
    console.log("❌ JSON/DB Error:", err.message);
  }
});


// ─────────────────────────────────────
// API: FETCH HISTORY
// ─────────────────────────────────────
app.get("/history", async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────
// SERVE FRONTEND
// ─────────────────────────────────────
app.use(express.static("public"));


// ─────────────────────────────────────
// START SERVER
// ─────────────────────────────────────
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Dashboard running on port ${PORT}`);
});
