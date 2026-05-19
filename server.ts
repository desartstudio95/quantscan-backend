import express from "express";
import cors from "cors";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

app.use(cors());

app.use(express.json({
  limit: "50mb"
}));

const PORT =
  process.env.PORT || 3000;

// ========================================
// GEMINI
// ========================================

const ai = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_API_KEY?.trim()
});

// ========================================
// ONESIGNAL PUSH
// ========================================

const sendNotification = async (
  title: string,
  message: string
) => {

  try {

    if (
      !process.env.ONESIGNAL_APP_ID ||
      !process.env.ONESIGNAL_API_KEY
    ) {

      console.log(
        "ONESIGNAL não configurado"
      );

      return;

    }

    await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {

        app_id:
          process.env.ONESIGNAL_APP_ID,

        included_segments: ["All"],

        headings: {
          en: title
        },

        contents: {
          en: message
        }

      },

      {

        headers: {

          Authorization:
            `Basic ${process.env.ONESIGNAL_API_KEY}`,

          "Content-Type":
            "application/json"

        }

      }
    );

    console.log(
      "Push enviada 🚀"
    );

  } catch (error: any) {

    console.log(
      "Erro push:",
      error?.response?.data ||
      error.message
    );

  }

};

// ========================================
// PREÇO REAL
// ========================================

const getPrice = async (
  pair: string
) => {

  try {

    const symbol =
      pair.replace("/", "");

    const url =
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${process.env.TWELVEDATA_API_KEY}`;

    const response =
      await axios.get(url);

    console.log(
      "PRICE API:",
      response.data
    );

    return response.data.price;

  } catch (error: any) {

    console.log(
      "Erro preço:",
      error.message
    );

    return null;

  }

};

// ========================================
// CANDLES REAIS
// ========================================

const getCandles = async (
  pair: string
) => {

  try {

    const symbol =
      pair.replace("/", "");

    const url =
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=5min&outputsize=30&apikey=${process.env.TWELVEDATA_API_KEY}`;

    const response =
      await axios.get(url);

    console.log(
      "CANDLES:",
      response.data
    );

    return response.data.values || [];

  } catch (error: any) {

    console.log(
      "Erro candles:",
      error.message
    );

    return [];

  }

};

// ========================================
// SMC ENGINE
// ========================================

const analyzeSMC = (
  candles: any[]
) => {

  if (
    !candles ||
    candles.length < 5
  ) {

    return {

      trend: "NEUTRAL",

      bos: "NO_BOS",

      choch: "NO_CHOCH",

      liquiditySweep: "NO_SWEEP",

      orderBlock: "NO_OB",

      fvg: "NO_FVG",

      score: 0,

      signal: "WAIT",

      lastClose: 0

    };

  }

  const highs =
    candles.map(c =>
      parseFloat(c.high)
    );

  const lows =
    candles.map(c =>
      parseFloat(c.low)
    );

  const closes =
    candles.map(c =>
      parseFloat(c.close)
    );

  const lastClose =
    closes[0];

  // ========================================
  // TREND
  // ========================================

  const trend =
    closes[0] > closes[3]
      ? "BULLISH"
      : "BEARISH";

  // ========================================
  // BOS
  // ========================================

  const prevHigh =
    Math.max(
      ...highs.slice(1, 10)
    );

  const prevLow =
    Math.min(
      ...lows.slice(1, 10)
    );

  let bos = "NO_BOS";

  if (lastClose > prevHigh) {
    bos = "BOS_UP";
  }

  if (lastClose < prevLow) {
    bos = "BOS_DOWN";
  }

  // ========================================
  // CHOCH
  // ========================================

  let choch = "NO_CHOCH";

  if (
    trend === "BULLISH" &&
    lastClose < prevLow
  ) {

    choch = "CHOCH_BEARISH";

  }

  if (
    trend === "BEARISH" &&
    lastClose > prevHigh
  ) {

    choch = "CHOCH_BULLISH";

  }

  // ========================================
  // LIQUIDITY
  // ========================================

  const liquiditySweep =
    trend === "BULLISH"
      ? "BUY_SIDE_LIQUIDITY"
      : "SELL_SIDE_LIQUIDITY";

  // ========================================
  // ORDER BLOCK
  // ========================================

  const orderBlock =
    trend === "BULLISH"
      ? "DEMAND_ZONE"
      : "SUPPLY_ZONE";

  // ========================================
  // FVG
  // ========================================

  const fvg =
    trend === "BULLISH"
      ? "FVG_BULLISH"
      : "FVG_BEARISH";

  // ========================================
  // SCORE
  // ========================================

  let score = 50;

  if (
    trend === "BULLISH"
  ) {
    score += 10;
  }

  if (
    bos === "BOS_UP"
  ) {
    score += 20;
  }

  if (
    bos === "BOS_DOWN"
  ) {
    score -= 20;
  }

  if (
    choch === "CHOCH_BULLISH"
  ) {
    score += 10;
  }

  if (
    choch === "CHOCH_BEARISH"
  ) {
    score -= 10;
  }

  // ========================================
  // SIGNAL
  // ========================================

  let signal = "WAIT";

  if (score >= 70) {
    signal = "BUY";
  }

  if (score <= 30) {
    signal = "SELL";
  }

  return {

    trend,

    bos,

    choch,

    liquiditySweep,

    orderBlock,

    fvg,

    score,

    signal,

    lastClose

  };

};

// ========================================
// TESTE
// ========================================

app.get("/", (
  req,
  res
) => {

  res.send(
    "QuantScan AI Backend Online 🚀"
  );

});

// ========================================
// PREÇO REAL
// ========================================

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

        error:
          "Preço não encontrado"

      });

    }

    res.json({

      pair,

      price

    });

  } catch (error: any) {

    res.status(500).json({

      error:
        error.message

    });

  }

});

// ========================================
// ANALISAR
// ========================================

app.post("/api/analyze", async (
  req,
  res
) => {

  try {

    const {
      imageBase64
    } = req.body;

    if (!imageBase64) {

      return res.status(400).json({

        error:
          "Imagem não enviada"

      });

    }

    // ========================================
    // CANDLES
    // ========================================

    const candles =
      await getCandles(
        "EUR/USD"
      );

    // ========================================
    // SMC
    // ========================================

    const smc =
      analyzeSMC(candles);

    console.log(
      "SMC:",
      smc
    );

    // ========================================
    // PROMPT
    // ========================================

    const prompt = `
Você é QuantScan AI PRO institucional.

Use análise Smart Money Concept profissional.

Dados SMC:

${JSON.stringify(smc)}

Faça análise detalhada:

- tendência
- BOS
- CHOCH
- liquidity sweep
- order block
- fair value gap
- momentum
- score institucional
- entrada
- stop loss
- take profit

Responda SOMENTE em JSON válido.
`;

    // ========================================
    // GEMINI
    // ========================================

    const response =
      await ai.models.generateContent({

        model:
          "gemini-2.5-flash",

        contents: [

          {

            parts: [

              {

                text: prompt

              },

              {

                inlineData: {

                  mimeType:
                    "image/jpeg",

                  data:
                    imageBase64

                }

              }

            ]

          }

        ],

        config: {

          responseMimeType:
            "application/json",

          responseSchema: {

            type:
              Type.OBJECT,

            properties: {

              pair: {
                type:
                  Type.STRING
              },

              decision: {
                type:
                  Type.STRING
              },

              entry: {
                type:
                  Type.STRING
              },

              stopLoss: {
                type:
                  Type.STRING
              },

              takeProfit: {
                type:
                  Type.STRING
              },

              score: {
                type:
                  Type.NUMBER
              },

              analysis: {
                type:
                  Type.STRING
              }

            },

            required: [

              "pair",

              "decision",

              "entry",

              "stopLoss",

              "takeProfit",

              "score",

              "analysis"

            ]

          }

        }

      });

    // ========================================
    // RESPONSE GEMINI
    // ========================================

    const text =
      response.text || "{}";

    console.log(
      "GEMINI RESPONSE:"
    );

    console.log(text);

    let parsed: any = {};

    try {

      parsed =
        JSON.parse(text);

    } catch {

      parsed = {

        pair: "EUR/USD",

        decision:
          smc.signal,

        entry:
          String(
            smc.lastClose
          ),

        stopLoss:
          "0.0000",

        takeProfit:
          "0.0000",

        score:
          smc.score,

        analysis:
          text

      };

    }

    // ========================================
    // PUSH
    // ========================================

    await sendNotification(

      "QuantScan AI 🚀",

      `Novo sinal ${parsed.decision} em ${parsed.pair}`

    );

    // ========================================
    // RESPOSTA FINAL
    // ========================================

    res.json({

      pair:
        parsed.pair ||
        "EUR/USD",

      decision:
        parsed.decision ||
        smc.signal,

      entry:
        parsed.entry ||
        "0.0000",

      stopLoss:
        parsed.stopLoss ||
        "0.0000",

      takeProfit:
        parsed.takeProfit ||
        "0.0000",

      score:
        parsed.score ||
        smc.score ||
        0,

      analysis:
        parsed.analysis ||
        "Sem análise",

      smc

    });

  } catch (error: any) {

    console.log(
      "ERRO API:"
    );

    console.log(error);

    res.status(500).json({

      error:
        error.message

    });

  }

});

// ========================================
// SERVER
// ========================================

app.listen(PORT, () => {

  console.log(
    `Servidor online na porta ${PORT}`
  );

});
