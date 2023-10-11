const axios = require("axios").default;
const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

module.exports = async (chat_id, text) => {
  await axios.post(TELEGRAM_URL, {
    chat_id,
    text,
  });

  return true;
};