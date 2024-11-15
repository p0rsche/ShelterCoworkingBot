const WebSocket = require("ws");

const sendMessage = require("../../sendMessage");
const statusCode = require("../../utils");
const messageParts = require("../../messageParts");

const BOT_NAME = "ShelterCoworkingBot";
const WEBSOCKET_URL = "wss://wss.zenrus.ru/";
const PARSE_MODE_MARKDOWN = "MarkdownV2";

const getRates = () => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.on("error", reject);

    ws.once('message', (data) => {
      const rates = data.toString();
      console.log("Received rates: ", rates);
      ws.close();
      resolve(rates);
    });
  })
}

const createStyledRate = (rate, title = 'USD \\($\\)') => {
  const [integerPart, fractionalPart] = rate.toString().split('.');
  
  return `${title} *${integerPart}*\\._${fractionalPart}_`;
}

const createMarkdownRates = (rates) => {
  const currencyRates = rates.split(';');
  const [usd, eur] = currencyRates;
  
  const usdTemplate = createStyledRate(usd);
  const eurTemplate = createStyledRate(eur, 'EUR \\(€\\)');

  return [usdTemplate, eurTemplate].join('\n');
}

const sendRates = async (chat_id) => {
  const rates = await getRates();
  const markdownRates = createMarkdownRates(rates);
  await sendMessage(chat_id, markdownRates, PARSE_MODE_MARKDOWN);
}

exports.handler = async (event) => {
  if ("body" in event && event.body === void 0) {
    console.log("Empty body received. Exiting");
    return statusCode(204);
  }
  let body
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.log("Error parsing event.body: ", error)
    return statusCode(500);
  }

  if(!("message" in body)) {
    console.log("Empty message received. Exiting");
    return statusCode(204);
  }

  console.log("Received body: ", body);
  
  const { message } = JSON.parse(event.body);
  if (!("text" in message)) {
    console.log("No text in message object. Exiting.");
    return statusCode(204)
  }

  const { command, botName, _extra } = messageParts(message.text);
  if (botName === BOT_NAME || botName === null) {
    try {
      switch (command) {
        case "rates":
          await sendRates(message.chat.id);
      }
    } catch (error) {
      console.log("Error while sending message: ", error);
      return statusCode(500);
    }
    
  }

  return statusCode(200)
}





