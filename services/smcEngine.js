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
// 1. TENDÊNCIA
// =========================

const trend =
  closes[closes.length - 1] >
  closes[closes.length - 3]
    ? "BULLISH"
    : "BEARISH";

// =========================
// 2. BOS (Break of Structure)
// =========================

const prevHigh =
  Math.max(...highs.slice(-10, -2));

const prevLow =
  Math.min(...lows.slice(-10, -2));

let bos = "NO_BOS";

if (lastClose > prevHigh) {
  bos = "BOS_BULLISH";
}

if (lastClose < prevLow) {
  bos = "BOS_BEARISH";
}

// =========================
// 3. CHOCH
// =========================

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

// =========================
// 4. LIQUIDITY SWEEP
// =========================

const previousHigh =
  highs[highs.length - 2];

const previousLow =
  lows[lows.length - 2];

let liquiditySweep = "NO_SWEEP";

if (lastClose < previousHigh) {
  liquiditySweep = "BUY_SIDE_LIQUIDITY";
}

if (lastClose > previousLow) {
  liquiditySweep = "SELL_SIDE_LIQUIDITY";
}

// =========================
// 5. ORDER BLOCK
// =========================

let orderBlock = "NEUTRAL_ZONE";

if (trend === "BULLISH") {
  orderBlock = "DEMAND_ZONE";
}

if (trend === "BEARISH") {
  orderBlock = "SUPPLY_ZONE";
}

// =========================
// 6. FAIR VALUE GAP
// =========================

const candle3High =
  highs[highs.length - 3];

const candle3Low =
  lows[lows.length - 3];

const currentHigh =
  highs[highs.length - 1];

const currentLow =
  lows[lows.length - 1];

let fvg = "NO_FVG";

if (currentLow > candle3High) {
  fvg = "FVG_BULLISH";
}

if (currentHigh < candle3Low) {
  fvg = "FVG_BEARISH";
}

// =========================
// 7. STRUCTURE SCORE
// =========================

let score = 50;

if (bos === "BOS_BULLISH") {
  score += 20;
}

if (bos === "BOS_BEARISH") {
  score -= 20;
}

if (choch === "CHOCH_BULLISH") {
  score += 15;
}

if (choch === "CHOCH_BEARISH") {
  score -= 15;
}

if (trend === "BULLISH") {
  score += 10;
}

if (trend === "BEARISH") {
  score -= 10;
}

if (fvg === "FVG_BULLISH") {
  score += 10;
}

if (fvg === "FVG_BEARISH") {
  score -= 10;
}

// =========================
// 8. SINAL FINAL
// =========================

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
    fvg,
    orderBlock,
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
