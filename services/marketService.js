const axios = require("axios");

async function getCandles(symbol = "EUR/USD") {
  try {
    const apiKey = process.env.TWELVE_API_KEY;

    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=15min&outputsize=30&apikey=${apiKey}`;

    const response = await axios.get(url);

    const values = response.data.values;

    if (!values) return [];

    // Converter para formato SMC
    return values.map(candle => ({
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      open: parseFloat(candle.open),
      volume: parseFloat(candle.volume || 0),
      datetime: candle.datetime
    }));
  } catch (error) {
    console.log("Market error:", error.message);
    return [];
  }
}

module.exports = {
  getCandles
};
