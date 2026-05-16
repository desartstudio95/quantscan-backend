const cron = require("node-cron");

const db = require("../firebase");

const getPrice = require("./priceService");

cron.schedule("*/1 * * * *", async () => {

  console.log("Monitorando sinais...");

  const snapshot = await db
    .collection("signals")
    .where("status", "==", "RUNNING")
    .get();

  snapshot.forEach(async (doc) => {

    const signal = doc.data();

    const price =
      await getPrice(signal.pair);

    console.log(signal.pair, price);

    if(signal.direction === "BUY") {

      if(price >= signal.takeProfit) {

        await doc.ref.update({
          status: "WIN"
        });

      }

      if(price <= signal.stopLoss) {

        await doc.ref.update({
          status: "LOSS"
        });

      }

    }

    if(signal.direction === "SELL") {

      if(price <= signal.takeProfit) {

        await doc.ref.update({
          status: "WIN"
        });

      }

      if(price >= signal.stopLoss) {

        await doc.ref.update({
          status: "LOSS"
        });

      }

    }

  });

});
