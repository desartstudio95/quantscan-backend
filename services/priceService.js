const axios = require("axios");

const getPrice = async (pair) => {

  try {

    const symbol =
      pair.slice(0,3) + "/" + pair.slice(3);

    const response = await axios.get(
      "https://api.twelvedata.com/price",
      {
        params: {
          symbol,
          apikey: process.env.TWELVE_API_KEY
        }
      }
    );

    return parseFloat(response.data.price);

  } catch (error) {

    console.log("Erro preço:", error.message);

    return null;
  }
};

module.exports = getPrice;
