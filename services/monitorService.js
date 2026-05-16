const cron = require("node-cron");

const db = require("../firebase");

const getPrice = require("./priceService");

cron.schedule("*/1 * * * *", async () => {

  console.log("Monitorando sinais...");

  try {

    const snapshot = await db
      .collection("signals")
      .where("status", "==", "RUNNING")
      .get();

    snapshot.forEach(async (doc) => {

      const signal = doc.data();

      const price =
        await getPrice(signal.pair);

      console.log(
        signal.pair,
        price
      );

      if(!price) return;

      // =====================
      // BUY
      // =====================

      if(signal.direction === "BUY") {

        // TAKE PROFIT

        if(price >= signal.takeProfit) {

          await doc.ref.update({
            status: "WIN",
            closedPrice: price,
            closedAt: new Date(),
            accuracy: 1
          });

          console.log("WIN:", signal.pair);

        }

        // STOP LOSS

        if(price <= signal.stopLoss) {

          await doc.ref.update({
            status: "LOSS",
            closedPrice: price,
            closedAt: new Date(),
            accuracy: -1
          });

          console.log("LOSS:", signal.pair);

        }

      }

      // =====================
      // SELL
      // =====================

      if(signal.direction === "SELL") {

        // TAKE PROFIT

        if(price <= signal.takeProfit) {

          await doc.ref.update({
            status: "WIN",
            closedPrice: price,
            closedAt: new Date(),
            accuracy: 1
          });

          console.log("WIN:", signal.pair);

        }

        // STOP LOSS

        if(price >= signal.stopLoss) {

          await doc.ref.update({
            status: "LOSS",
            closedPrice: price,
            closedAt: new Date(),
            accuracy: -1
          });

          console.log("LOSS:", signal.pair);

        }

      }

    });

  } catch (error) {

    console.log(error.message);

  }

});
