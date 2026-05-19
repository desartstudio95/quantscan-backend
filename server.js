const express = require("express");
const cors = require("cors");
const axios = require("axios");

const {
  GoogleGenerativeAI
} = require("@google/generative-ai");

const {
  getCandles
} = require("./services/marketService");

const {
  analyzeSMC
} = require("./services/smcEngine");

const {
  sendNotification
} = require("./services/notificationService");

const getPrice =
  require("./services/priceService");

const db =
  require("./firebase");

// MONITOR TP/SL
require("./services/monitorService");

// =====================================
// EXPRESS
// =====================================

const app = express();

app.use(cors());

app.use(express.json({
  limit: "50mb"
}));

const PORT =
  process.env.PORT || 3000;

// =====================================
// GEMINI
// =====================================

const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

const model =
  genAI.getGenerativeModel({

    model:
      "gemini-2.5-flash"

  });

console.log(
  "GEMINI:",
  process.env.GEMINI_API_KEY
    ? "OK"
    : "MISSING"
);

// =====================================
// TESTE BACKEND
// =====================================

app.get("/", (req, res) => {

  res.send(
    "QuantScan Backend Online 🚀"
  );

});

// =====================================
// HEALTH CHECK
// =====================================

app.get("/health", (
  req,
  res
) => {

  res.json({

    success: true,

    status: "ONLINE",

    gemini:
      !!process.env.GEMINI_API_KEY,

    twelveData:
      !!process.env.TWELVEDATA_API_KEY,

    oneSignal:
      !!process.env.ONESIGNAL_APP_ID

  });

});

// =====================================
// PREÇO REAL
// =====================================

app.get("/price/:pair", async (
  req,
  res
) => {

  try {

    const pair =
      req.params.pair;

    const price =
      await getPrice(pair);

    if (!price) {

      return res.status(404).json({

        success: false,

        error:
          "Preço não encontrado"

      });

    }

    res.json({

      success: true,

      pair,

      price

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      error:
        error.message

    });

  }

});

// =====================================
// LISTAR SINAIS
// =====================================

app.get("/signals", async (
  req,
  res
) => {

  try {

    const snapshot =
      await db
        .collection("signals")
        .orderBy(
          "createdAt",
          "desc"
        )
        .limit(20)
        .get();

    const signals = [];

    snapshot.forEach((doc) => {

      signals.push({

        id: doc.id,

        ...doc.data()

      });

    });

    res.json({

      success: true,

      signals

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      error:
        error.message

    });

  }

});

// =====================================
// STATS
// =====================================

app.get("/stats", async (
  req,
  res
) => {

  try {

    const snapshot =
      await db
        .collection("signals")
        .get();

    let total = 0;
    let wins = 0;
    let losses = 0;
    let running = 0;

    snapshot.forEach((doc) => {

      const signal =
        doc.data();

      total++;

      if (
        signal.status === "WIN"
      ) {
        wins++;
      }

      if (
        signal.status === "LOSS"
      ) {
        losses++;
      }

      if (
        signal.status === "RUNNING"
      ) {
        running++;
      }

    });

    const winRate =
      total > 0
        ? (
            (wins / total) *
            100
          ).toFixed(2)
        : "0";

    res.json({

      success: true,

      totalSignals:
        total,

      wins,

      losses,

      running,

      winRate:
        `${winRate}%`

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      error:
        error.message

    });

  }

});

// =====================================
// ANALISAR GRÁFICO
// =====================================

app.post("/api/analyze", async (
  req,
  res
) => {

  try {

    const {
      image,
      pair
    } = req.body;

    if (!image) {

      return res.status(400).json({

        success: false,

        error:
          "Imagem não enviada"

      });

    }

    // =====================================
    // PAR
    // =====================================

    const selectedPair =
      pair || "XAU/USD";

    // =====================================
    // PREÇO REAL
    // =====================================

    const marketPrice =
      await getPrice(
        selectedPair
      );

    if (!marketPrice) {

      return res.status(500).json({

        success: false,

        error:
          "Erro ao buscar preço real"

      });

    }

    // =====================================
    // CANDLES REAIS
    // =====================================

    const candles =
      await getCandles(
        selectedPair
      );

    if (
      !candles ||
      candles.length < 5
    ) {

      return res.status(500).json({

        success: false,

        error:
          "Erro ao buscar candles"

      });

    }

    // =====================================
    // SMC
    // =====================================

    const smcResult =
      analyzeSMC(candles);

    console.log(
      "SMC:",
      smcResult
    );

    // =====================================
    // TP / SL
    // =====================================

    const price =
      parseFloat(
        marketPrice
      );

    let stopLoss;
    let takeProfit;

    if (
      smcResult.signal ===
      "BUY"
    ) {

      stopLoss =
        (price - 15)
        .toFixed(2);

      takeProfit =
        (price + 30)
        .toFixed(2);

    } else {

      stopLoss =
        (price + 15)
        .toFixed(2);

      takeProfit =
        (price - 30)
        .toFixed(2);

    }

    // =====================================
    // ANALYSIS TEXT
    // =====================================

    let analysis = `
Smart Money Concept detectado.

Trend: ${smcResult.trend}

BOS: ${smcResult.bos}

CHOCH: ${smcResult.choch}

Liquidity:
${smcResult.liquiditySweep}

Order Block:
${smcResult.orderBlock}

FVG:
${smcResult.fvg}

Score:
${smcResult.score}
`;

    // =====================================
    // GEMINI
    // =====================================

    try {

      const result =
        await model.generateContent([

          `
Você é QuantScan AI PRO.

Explique esta análise institucional:

${analysis}
          `,

          {
            inlineData: {

              mimeType:
                "image/png",

              data:
                image

            }
          }

        ]);

      const response =
        await result.response;

      const text =
        response.text();

      if (
        text &&
        text.length > 10
      ) {

        analysis = text;

      }

    } catch (geminiError) {

      console.log(
        "Gemini fallback ativado"
      );

    }

    // =====================================
    // RESULTADO FINAL
    // =====================================

    const finalData = {

      success: true,

      pair:
        selectedPair,

      decision:
        smcResult.signal,

      entry:
        price.toFixed(2),

      stopLoss,

      takeProfit,

      score:
        smcResult.score,

      analysis,

      smc:
        smcResult

    };

    // =====================================
    // FIREBASE
    // =====================================

    await db
      .collection("signals")
      .add({

        ...finalData,

        status:
          "RUNNING",

        createdAt:
          new Date()

      });

    // =====================================
    // PUSH
    // =====================================

    try {

      await sendNotification(

        `QuantScan ${smcResult.signal} 🚀`,

        `${selectedPair} | Score ${smcResult.score}%`

      );

    } catch (pushError) {

      console.log(
        "Erro push"
      );

    }

    // =====================================
    // RESPONSE
    // =====================================

    res.json(finalData);

  } catch (error) {

    console.log(
      "ERRO ANALYZE:"
    );

    console.log(error);

    res.status(500).json({

      success: false,

      error:
        error.message

    });

  }

});

// =====================================
// SERVER
// =====================================

app.listen(PORT, () => {

  console.log(
    `Servidor online na porta ${PORT}`
  );

});
