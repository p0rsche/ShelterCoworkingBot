const axios = require("axios").default;
const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

module.exports = async (chat_id, text, parse_mode) => {
  const result = await axios.post(TELEGRAM_URL, {
    chat_id,
    text,
    parse_mode,
  });

  console.log(result);

  return true;
};