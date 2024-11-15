const WebSocket = require("ws");

const sendMessage = require("../../sendMessage");
const statusCode = require("../../utils");
const messageParts = require("../../messageParts");

const BOT_NAME = "ShelterCoworkingBot";
const WEBSOCKET_URL = "wss://wss.zenrus.ru/";
const PARSE_MODE_MARKDOWN = "MarkdownV2";

const EXCHANGERATES_API_KEY = process.env.EXCHANGERATES_API_KEY;

const CURRENCY_SYMBOLS = {
  'RUB': '₽',
  'USD': '$',
  'EUR': '€',
  'CNY': '¥'
}

const getRates = () => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.on("error", reject);

    ws.once('message', (data) => {
      const rates = data.toString();
      console.log("getRates(): Received rates=", rates);
      ws.close();
      const [USD, EUR] = rates.split(';');
      resolve({
        USD,
        EUR,
      });
    });
  })
}

const getExchangeRates = async () => {
  const headers = new Headers();
  headers.append('apikey', EXCHANGERATES_API_KEY);

  const requestOptions = {
    method: 'GET',
    redirect: 'follow',
    headers,
  }

  const base = 'RUB';
  const symbols = ['USD', 'EUR', 'CNY'];

  const searchParams = new URLSearchParams({ base, symbols });

  const url = new URL(`https://api.apilayer.com/exchangerates_data/latest?${searchParams}`);

  try {
    const response = await fetch(url, requestOptions);
    const textResponse = await response.text();
    console.info('getExchangeRates(): text response=', textResponse);
    const jsonResponse = JSON.parse(textResponse);
    if (jsonResponse.success === true) {
      const results = {};

      for (const currency of symbols) {
        if (currency in jsonResponse.rates) {
          results[currency] = (1 / jsonResponse.rates[currency]).toFixed(3);
        }
      }
      console.info('getExchangeRates(): results=', results);
      return results;
    }
  } catch (e) {
    console.error('Error getting exchangerates:', e)
  }
}

const createStyledMarkdownRate = (symbol, value) => {
  const [integerPart, fractionalPart] = value.toString().split('.');

  const result = `${symbol} \\(${CURRENCY_SYMBOLS[symbol]}\\) *${integerPart}*\\._${fractionalPart}_`;

  console.info(`createStyledMarkdownRate(${symbol}): `, result);
  return result;
}

const createMarkdownRates = (title, rates) => {
  let tmpl = `${title}: `;

  for(const [key, value] of Object.entries(rates)) {
    tmpl += `${createStyledMarkdownRate(value, key)} `;
  }

  console.info('createMarkdownRates(): ', tmpl);
  return tmpl;
}

const sendRates = async (chat_id) => {
  const zenRates = await getRates();
  const exchangeRates = getExchangeRates();
  const markdownZenRates = createMarkdownRates('ZenRates', zenRates);
  const markdownExchangeRates = createMarkdownRates('ExchangeRates API', exchangeRates);

  const message = [markdownZenRates, markdownExchangeRates].join('\n');

  console.info('sendRates(): message=', message);

  await sendMessage(chat_id, message, PARSE_MODE_MARKDOWN);
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

  if (!("message" in body)) {
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





