const express = require("express");
const cors = require("cors");

const db = require("./firebase");

const getPrice = require("./services/priceService");

// IMPORTA O MONITOR TP/SL
require("./services/monitorService");

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// TESTE BACKEND
// ===============================

app.get("/", (req, res) => {

  res.send("QuantScan Backend Online 🚀");

});


// ===============================
// PREÇO REAL FOREX
// ===============================

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


// ===============================
// SALVAR SINAL
// ===============================

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


// ===============================
// LISTAR SINAIS
// ===============================

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


// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(process.env.PORT || 3000, () => {

  console.log("Servidor online 🚀");

});
