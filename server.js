const db = require("../firebase");

const updateAI = async () => {

  const snapshot =
    await db.collection("signals").get();

  let wins = 0;

  let losses = 0;

  snapshot.forEach((doc) => {

    const signal = doc.data();

    if(signal.status === "WIN")
      wins++;

    if(signal.status === "LOSS")
      losses++;

  });

  const total = wins + losses;

  const accuracy =
    total > 0
    ? ((wins / total) * 100)
    : 0;

  await db
    .collection("ai")
    .doc("stats")
    .set({

      wins,
      losses,
      accuracy,
      updatedAt: new Date()

    });

};

module.exports = updateAI;
