const YAML = require('yamljs');
const fs = require('fs');

function sendMessage(client, username, message) {
  if (!client.readyAt) {
    return;
  }
  const guilds = client.guilds.array();
  if (guilds.length) {
    const firstGuild = guilds[0];
    const discordUser = firstGuild.members.array().find(
      u => u.displayName.toLowerCase() === username || u.user.username.toLowerCase() === username
    );
    if (discordUser) {
      discordUser.sendMessage(message);
    }
  }
}

module.exports = function(config){
  const Discord = require('discord.js');
  const client = new Discord.Client();

  let filename = null;
  const configFiles = ['config.yml', 'config.yaml'];
  for (const file of configFiles) {
    try {
      fs.statSync(file);
      filename = file;
    } catch (_) { }
  }
  if (!filename) throw new Error("config.yaml or config.yml not found");
  
  const { discordBot } = YAML.parse(fs.readFileSync(filename, 'utf8'));
  if (!discordBot) {
    throw new Error(`discord bot configuration not found in ${filename}`);
  }

  client.login(discordBot.token);
  client.on('ready', () => {
    sendMessage(client, discordBot.testUsername, "Screeps is online");
    console.log("connected to discord");
  });
  client.on('error', (e) => {
    console.error("unable to connec to discord", e);
  });

  config.backend.on('sendUserNotifications', function(user, notifications) {
    notifications.forEach(notification => {
      sendMessage(user.username).sendMessage(notification.message);
    });
  });
}