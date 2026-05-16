const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("QuantScan Backend Online 🚀");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor online");
});
