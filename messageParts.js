module.exports = (text) => {
  const commandMatch = text.match(/(?<=\/).*?(?=$| |@)/);
  const command = commandMatch ? commandMatch[0] : null;

  const botNameMatch = text.match(/(?<=@).*?(?=($| ))/);
  const botName = botNameMatch ? botNameMatch[0] : null;

  const extraMatch = text.match(/(?<=\s).*?(?=$)/);
  const extra = extraMatch ? extraMatch[0] : null;

  return {
    command,
    botName,
    extra,
  };
};