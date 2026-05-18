// services/smcEngine.js

function analyzeSMC(candles) {
  if (!candles || candles.length < 5) {
    return {
      error: "Dados insuficientes para análise SMC"
    };
  }

  // Converter candles
  const highs = candles.map(c => parseFloat(c.high));
  const lows = candles.map(c => parseFloat(c.low));
  const closes = candles.map(c => parseFloat(c.close));

  const lastClose = closes[closes.length - 1];

  // =========================
  // 1. TENDÊNCIA SIMPLES
  // =========================
  const trend =
    closes[closes.length - 1] > closes[closes.length - 3]
      ? "BULLISH"
      : "BEARISH";

  // =========================
  // 2. BOS (Break of Structure)
  // =========================
  const prevHigh = Math.max(...highs.slice(-10, -2));
  const bos = lastClose > prevHigh ? "BOS_UP" : "NO_BOS";

  // =========================
  // 3. CHOCH (Change of Character)
  // =========================
  const prevLow = Math.min(...lows.slice(-10, -2));
  const choch = lastClose < prevLow ? "CHOCH_DOWN" : "NO_CHOCH";

  // =========================
  // 4. LIQUIDITY SWEEP (simples)
  // =========================
  const wickHigh = highs[highs.length - 2];
  const liquiditySweep =
    lastClose < wickHigh ? "LIQUIDITY_SWEEP" : "NO_SWEEP";

  // =========================
  // 5. STRUCTURE SCORE
  // =========================
  let score = 50;

  if (bos === "BOS_UP") score += 20;
  if (choch === "CHOCH_DOWN") score -= 20;
  if (trend === "BULLISH") score += 10;
  if (liquiditySweep === "LIQUIDITY_SWEEP") score += 10;

  // =========================
  // RESULTADO FINAL
  // =========================
  let signal = "WAIT";

  if (score >= 70) signal = "BUY";
  if (score <= 30) signal = "SELL";

  return {
    trend,
    bos,
    choch,
    liquiditySweep,
    score,
    signal,
    lastClose
  };
}

module.exports = {
  analyzeSMC
};
