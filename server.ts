import express from "express";
import cors from "cors";

import {
  GoogleGenAI,
  Type
} from "@google/genai";

import {
  getCandles
} from "./services/marketService";

import {
  analyzeSMC
} from "./services/smcEngine";

import {
  sendNotification
} from "./services/notificationService";

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "50mb"
  })
);

const PORT =
  process.env.PORT || 3000;

const ai = new GoogleGenAI({

  apiKey:
    process.env.GEMINI_API_KEY?.trim()

});

// ========================================
// TESTE
// ========================================

app.get("/", (req, res) => {

  res.send(
    "QuantScan AI Backend Online 🚀"
  );

});
// ========================================
// PREÇO REAL
// ========================================

app.get("/price/:pair", async (req, res) => {

  try {

    const pair =
      req.params.pair;

    const candles =
      await getCandles(pair);

    if (!candles || !candles.length) {

      return res.status(404).json({
        error: "Preço não encontrado"
      });

    }

    const last =
      candles[candles.length - 1];

    res.json({

      pair,

      price: last.close,

      candle: last

    });

  } catch (error: any) {

    res.status(500).json({

      error:
        error.message

    });

  }

});


// ========================================
// ANALISAR GRÁFICO
// ========================================

app.post(
  "/api/analyze",
  async (req, res) => {

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
      // CANDLES REAIS
      // ========================================

      const candles =
        await getCandles("EUR/USD");

      // ========================================
      // SMC ENGINE
      // ========================================

      const smc =
        analyzeSMC(candles);

      console.log(
        "SMC:",
        smc
      );

      // ========================================
      // PROMPT IA
      // ========================================

      const prompt = `
Você é QuantScan AI PRO institucional.

Utilize Smart Money Concepts reais.

Dados detectados pelo motor SMC:

${JSON.stringify(smc)}

Faça análise institucional completa:

- tendência
- BOS
- CHOCH
- liquidity sweep
- fair value gap
- order blocks
- manipulação institucional
- momentum
- probabilidade
- entrada
- stop loss
- take profit
- score IA

Responda em JSON profissional.
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

                  text:
                    prompt

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

                trend: {
                  type:
                    Type.STRING
                },

                bos: {
                  type:
                    Type.STRING
                },

                choch: {
                  type:
                    Type.STRING
                },

                liquidity: {
                  type:
                    Type.STRING
                },

                orderBlock: {
                  type:
                    Type.STRING
                },

                fvg: {
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

              }

            }

          }

        });

      // ========================================
      // PARSE JSON IA
      // ========================================

      const text =
        response.text || "{}";

      const parsed =
        JSON.parse(text);

      // ========================================
      // PUSH NOTIFICATION
      // ========================================

      await sendNotification(

        `QuantScan ${parsed.decision} 🚀`,

        `${parsed.pair} | Score ${parsed.score}%`

      );

      // ========================================
      // RESPOSTA FINAL
      // ========================================

      res.json({

        success: true,

        ai: parsed,

        smc

      });

    } catch (error: any) {

      console.log(error);

      res.status(500).json({

        error:
          error.message

      });

    }

  }
);

// ========================================
// SERVER
// ========================================

app.listen(PORT, () => {

  console.log(
    `Servidor online na porta ${PORT}`
  );

});
