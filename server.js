const express = require("express");
const cors = require("cors");
const db = require("./firebase");
const getPrice = require("./services/priceService");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("QuantScan Backend Online 🚀");
});

app.get("/price/:pair", async (req, res) => {

  try {

    const pair = req.params.pair;

    const price = await getPrice(pair);

    res.json({
      pair,
      price
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor online");
});
