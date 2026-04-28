const express = require("express");
const mqtt = require("mqtt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ─── MQTT CONFIG ─────────────────────────────
const client = mqtt.connect("mqtt://f1108f1ecd8140f98e0b481a54f10251.s1.eu.hivemq.cloud:8884", {
  username: "esp32",
  password: "Esp1234567",
});

let latestSensor = {
  ax: 0, ay: 0, az: 0, mag: 1,
};

let latestGPS = {
  lat: 0, lng: 0, speed: 0, sats: 0,
};

let events = [];
let trajectory = [];

// ─── MQTT CONNECTION ─────────────────────────
client.on("connect", () => {
  console.log("MQTT Connected");
  client.subscribe("vehicle/data");
});

// ─── RECEIVE DATA ────────────────────────────
client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    // Sensor
    latestSensor = {
      ax: data.ax,
      ay: data.ay,
      az: data.az,
      mag: data.mag,
    };

    // GPS
    latestGPS = {
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      sats: data.sats,
    };

    // Trajectory
    if (data.lat && data.lng) {
      trajectory.push({ lat: data.lat, lng: data.lng });
      if (trajectory.length > 500) trajectory.shift();
    }

    // Events
    let ev = {};
    if (data.state === "COLLISION") ev.collision = true;
    if (data.state === "RASH") ev.rash = true;
    if (data.state === "TOW") ev.tow = true;
    if (data.state === "TOPPLE") ev.topple = true;

    if (Object.keys(ev).length > 0) {
      events.unshift({
        type: Object.keys(ev)[0],
        ts: Math.floor(Date.now() / 1000),
        ax: data.ax,
        ay: data.ay,
        az: data.az,
      });

      if (events.length > 100) events.pop();
    }

  } catch (e) {
    console.log("Parse error", e);
  }
});

// ─── API ROUTES ──────────────────────────────

// Main sensor API
app.get("/api/sensor", (req, res) => {
  res.json({
    sensor: latestSensor,
    gps: latestGPS,
    events: {
      collision: false,
      rash: false,
      tow: false,
      topple: false,
    }
  });
});

// Events history
app.get("/api/events", (req, res) => {
  res.json(events);
});

// Clear events
app.delete("/api/events", (req, res) => {
  events = [];
  res.json({ ok: true });
});

// Trajectory
app.get("/api/trajectory", (req, res) => {
  res.json(trajectory);
});

// ─── START SERVER ────────────────────────────
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
