import express from "express";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY?.trim()
});

// ========================================
// TESTE
// ========================================

app.get("/", (req, res) => {
  res.send("QuantScan AI Backend Online 🚀");
});

// ========================================
// ANALISAR GRÁFICO
// ========================================

app.post("/api/analyze", async (req, res) => {

  try {

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        error: "Imagem não enviada"
      });
    }

    const prompt = `
    Você é QuantScan AI PRO.

    Analise este gráfico.

    Faça:
    - tendência
    - suporte e resistência
    - Smart Money Concept
    - Liquidity Sweep
    - momentum
    - entrada
    - take profit
    - stop loss
    - score IA

    Responda em JSON.
    `;

    const response = await ai.models.generateContent({

      model: "gemini-2.5-flash",

      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ],

      config: {

        responseMimeType: "application/json",

        responseSchema: {
          type: Type.OBJECT,

          properties: {

            pair: {
              type: Type.STRING
            },

            decision: {
              type: Type.STRING
            },

            entry: {
              type: Type.STRING
            },

            stopLoss: {
              type: Type.STRING
            },

            takeProfit: {
              type: Type.STRING
            },

            score: {
              type: Type.NUMBER
            },

            analysis: {
              type: Type.STRING
            }

          }
        }
      }
    });

    const text =
      response.text || "{}";

    const parsed =
      JSON.parse(text);

    res.json(parsed);

  } catch (error: any) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });

  }

});

// ========================================
// SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`Servidor online na porta ${PORT}`);
});
