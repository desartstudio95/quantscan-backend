const { admin } =
require("../firebase");

const sendPushNotification =
async (token, title, body) => {

  try {

    const message = {

      notification: {
        title,
        body
      },

      token

    };

    const response =
      await admin
        .messaging()
        .send(message);

    console.log(
      "Push enviado:",
      response
    );

  } catch (error) {

    console.log(
      "Erro Push:",
      error.message
    );

  }

};

module.exports =
sendPushNotification;
