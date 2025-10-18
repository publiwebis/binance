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
📄 package.json (copia esto completo):

{
  "name": "binance-proxy",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "node-fetch": "^3.3.2",
    "cors": "^2.8.5"
  }
}
