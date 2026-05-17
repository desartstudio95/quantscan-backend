const express = require("express");

const { GoogleGenerativeAI } =
require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY 
);

console.log(
"GEMINI KEY:",
process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

const cors = require("cors");

const db = require("./firebase");

const getPrice = require("./services/priceService");

// MONITOR TP/SL
require("./services/monitorService");

const app = express();

app.use(cors());
app.use(express.json());


// =====================================
// TESTE BACKEND
// =====================================

app.get("/", (req, res) => {

  res.send("QuantScan Backend Online 🚀");

});


// =====================================
// PREÇO REAL FOREX
// =====================================

app.get("/price/:pair", async (req, res) => {

  try {

    const pair = req.params.pair;

    const price = await getPrice(pair);

    res.json({
      pair,
      price
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =====================================
// CRIAR SINAL
// =====================================

app.post("/signal", async (req, res) => {

  try {

    const signal = req.body;

    signal.status = "RUNNING";

    signal.createdAt = new Date();

    await db.collection("signals").add(signal);

    res.json({
      success: true,
      signal
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =====================================
// LISTAR SINAIS
// =====================================

app.get("/signals", async (req, res) => {

  try {

    const snapshot =
      await db.collection("signals").get();

    const signals = [];

    snapshot.forEach((doc) => {

      signals.push({
        id: doc.id,
        ...doc.data()
      });

    });

    res.json(signals);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =====================================
// ESTATÍSTICAS IA
// =====================================

app.get("/stats", async (req, res) => {

  try {

    const snapshot =
      await db.collection("signals").get();

    let total = 0;

    let wins = 0;

    let losses = 0;

    let running = 0;

    let accuracy = 0;

    snapshot.forEach((doc) => {

      const signal = doc.data();

      total++;

      if(signal.status === "WIN") {

        wins++;

        accuracy += 1;

      }

      if(signal.status === "LOSS") {

        losses++;

        accuracy -= 1;

      }

      if(signal.status === "RUNNING") {

        running++;

      }

    });

    const winRate =
      total > 0
      ? ((wins / total) * 100).toFixed(2)
      : 0;

    res.json({

      totalSignals: total,

      wins,

      losses,

      running,

      winRate: `${winRate}%`,

      aiAccuracy: accuracy

    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


// =====================================
// SERVIDOR
// =====================================

app.listen(process.env.PORT || 3000, () => {

  console.log("Servidor online 🚀");

});
