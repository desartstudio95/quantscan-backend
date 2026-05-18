const axios = require("axios");

const sendNotification = async (
  title,
  message,
  data = {}
) => {

  try {

    const response = await axios.post(

      "https://onesignal.com/api/v1/notifications",

      {

        app_id:
          process.env.ONESIGNAL_APP_ID,

        included_segments: [
          "All"
        ],

        headings: {
          en: title
        },

        contents: {
          en: message
        },

        data,

        priority: 10,

        android_channel_id:
          process.env.ONESIGNAL_ANDROID_CHANNEL_ID,

        small_icon:
          "ic_stat_onesignal_default",

        large_icon:
          "https://yourdomain.com/logo.png"

      },

      {

        headers: {

          Authorization:
`Basic ${process.env.ONESIGNAL_API_KEY}`,

          "Content-Type":
            "application/json"

        }

      }

    );

    console.log(
      "Push enviada 🚀"
    );

    console.log(
      response.data
    );

  } catch (error) {

    console.log(
      "Erro push:",
      error.response?.data ||
      error.message
    );

  }

};

module.exports = {
  sendNotification
};
