const WebSocket = require("ws");

const sendMessage = require("../../sendMessage");
const statusCode = require("../../utils");
const messageParts = require("../../messageParts");

const WEBSOCKET_URL = "wss://wss.zenrus.ru/";

const getRates = () => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.on("error", reject);

    ws.once('message', (data) => {
      const rates = data.toString();
      ws.close();
      console.log("Received rates: ", rates);
      resolve(rates.split(';')[0]);
    });
  })
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
  const usd = await getRates();
  const { message } = JSON.parse(event.body);
  if (!("text" in message)) {
    console.log("No text in message object. Exiting.");
    return statusCode(204)
  }
  const { command, botName, extra } = messageParts(message.text);
  if (botName === "ShelterCoworkingBot" || botName === null) {
    switch (command) {
      case "rates":
        await sendMessage(message.chat.id, "USD/RUB: " + usd);
        break;
      case "start":
        break;
      default:
        await sendMessage(message.chat.id, "I don't understand, buddy. The only command available is /rates");
    }
  }

  return statusCode(200)
}





