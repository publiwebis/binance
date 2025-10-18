import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Binance Proxy activo ✅" });
});

// 🆕 Endpoint para llamadas públicas (sin API keys)
app.post("/binance-public", async (req, res) => {
  try {
    const { endpoint, method = "GET" } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: "Falta endpoint" });
    }

    const url = `https://api.binance.com${endpoint}`;

    console.log(`📡 Public request: ${endpoint}`);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    const data = await response.text();

    if (!response.ok) {
      return res.json({ success: false, error: `Binance error: ${response.status} - ${data}` });
    }

    res.json({ success: true, data: JSON.parse(data) });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Endpoint para llamadas autenticadas (con API keys)
app.post("/binance", async (req, res) => {
  try {
    const { endpoint, method = "GET", params = {}, apiKey, apiSecret } = req.body;

    if (!endpoint || !apiKey || !apiSecret) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    const timestamp = Date.now();
    const allParams = { ...params, timestamp };
    const queryString = new URLSearchParams(allParams).toString();
    
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(queryString)
      .digest("hex");

    const url = `https://api.binance.com${endpoint}?${queryString}&signature=${signature}`;

    console.log(`📡 Proxy request: ${endpoint}`);

    const response = await fetch(url, {
      method,
      headers: {
        "X-MBX-APIKEY": apiKey,
        "Content-Type": "application/json"
      }
    });

    const data = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    res.json({ success: true, data: JSON.parse(data) });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Binance Proxy en puerto ${PORT}`));
