const axios = require("axios");

async function getCandles(symbol = "EUR/USD") {

  const apiKey = process.env.TWELVE_API_KEY;

  const url =
    `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=15min&outputsize=50&apikey=${apiKey}`;

  const response = await axios.get(url);

  return response.data;

}

module.exports = {
  getCandles
};
