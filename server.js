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
  "GEMINI KEY:",
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
      process.env.GEMINI_API_KEY
        ? true
        : false,

    twelveData:
      process.env.TWELVEDATA_API_KEY
        ? true
        : false,

    oneSignal:
      process.env.ONESIGNAL_APP_ID
        ? true
        : false

  });

});

// =====================================
// PREÇO REAL FOREX
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
// CRIAR SINAL
// =====================================

app.post("/signal", async (
  req,
  res
) => {

  try {

    const signal =
      req.body;

    signal.status =
      "RUNNING";

    signal.createdAt =
      new Date();

    await db
      .collection("signals")
      .add(signal);

    res.json({

      success: true,

      signal

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
// ESTATÍSTICAS IA
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
        : 0;

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

    const selectedPair =
      pair || "EUR/USD";

    // =====================================
    // CANDLES REAIS
    // =====================================

    const candles =
      await getCandles(
        selectedPair
      );

    console.log(
      "Candles:",
      candles?.length
    );

    if (
      !candles ||
      candles.length === 0
    ) {

      return res.status(500).json({

        success: false,

        error:
          "Erro ao buscar candles reais"

      });

    }

    // =====================================
    // SMC ENGINE
    // =====================================

    const smcResult =
      analyzeSMC(candles);

    console.log(
      "SMC RESULT:",
      smcResult
    );

    // =====================================
    // PROMPT IA
    // =====================================

    const prompt = `
Você é QuantScan AI PRO institucional.

Use Smart Money Concepts reais.

Dados SMC detectados:

${JSON.stringify(smcResult)}

Par:
${selectedPair}

Faça análise completa:

- tendência
- BOS
- CHOCH
- suporte/resistência
- liquidity sweep
- order block
- fair value gap
- manipulação institucional
- momentum
- score IA
- entrada
- take profit
- stop loss

Responda SOMENTE em JSON válido.

Formato:

{
  "pair": "EUR/USD",
  "decision": "BUY",
  "entry": "1.09000",
  "stopLoss": "1.08500",
  "takeProfit": "1.09500",
  "score": 87,
  "analysis": "texto"
}
`;

    // =====================================
    // GEMINI
    // =====================================

    const result =
      await model.generateContent([

        prompt,

        {
          inlineData: {

            mimeType:
              "image/png",

            data: image

          }
        }

      ]);

    const response =
      await result.response;

    const text =
      response.text();

    console.log(
      "GEMINI RESPONSE:"
    );

    console.log(text);

    let parsed;

    try {

      parsed =
        JSON.parse(text);

    } catch {

      parsed = {

        pair:
          selectedPair,

        decision:
          smcResult.signal,

        entry:
          String(
            smcResult.lastClose
          ),

        stopLoss:
          "0.0000",

        takeProfit:
          "0.0000",

        score:
          smcResult.score,

        analysis:
          text

      };

    }

    // =====================================
    // SALVAR FIREBASE
    // =====================================

    await db
      .collection("signals")
      .add({

        ...parsed,

        smc:
          smcResult,

        status:
          "RUNNING",

        createdAt:
          new Date()

      });

    // =====================================
    // PUSH NOTIFICATION
    // =====================================

    await sendNotification(

      `QuantScan ${parsed.decision} 🚀`,

      `${selectedPair} | Score ${parsed.score}%`

    );

    // =====================================
    // RESPOSTA FINAL
    // =====================================

    res.json({

      success: true,

      pair:
        parsed.pair,

      decision:
        parsed.decision,

      entry:
        parsed.entry,

      stopLoss:
        parsed.stopLoss,

      takeProfit:
        parsed.takeProfit,

      score:
        parsed.score,

      analysis:
        parsed.analysis,

      smc:
        smcResult

    });

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
// SERVIDOR
// =====================================

app.listen(PORT, () => {

  console.log(
    `Servidor online na porta ${PORT}`
  );

});
