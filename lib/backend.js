const q = require('q');
const YAML = require('yamljs');
const fs = require('fs');
const _ = require('lodash');

const Discord = require('discord.js');
const client = new Discord.Client();

function sendMessage(username, message) {
  if (!client.readyAt) {
    return;
  }
  const guilds = client.guilds.array();
  if (guilds.length) {
    const firstGuild = guilds[0];
    const discordUser = firstGuild.members.array().find(
      u => u.displayName.toLowerCase() === username.toLowerCase()
        || u.user.username.toLowerCase() === username.toLowerCase()
    );
    if (discordUser) {
      discordUser.send(message);
    } else {
      throw new Error("user not found");
    }
  }
}

function sendNotifications(config) {
  const { db } = config.common.storage;
  if (!db || !client.readyAt) return;
  let notifications;
  return db['users.notifications'].find({})
    .then((data) => {
      notifications = data;
      return _(notifications).pluck('user').uniq(false, (i) => i.toString()).value();
    })
    .then((userIds) => db.users.find({_id: {$in: userIds}}))
    .then((users) => {
      let promise = q.when();
      users.forEach((user) => {
        const notificationIdsToRemove = [];
        promise = promise.then(() => {
          const userNotifications = _.filter(notifications, (i) => i.user == user._id);
          userNotifications.forEach(notification => {
            sendMessage(user.username, notification.message);
            notificationIdsToRemove.push(notification._id);
          });
        })
        .catch((e) => console.log(`Error sending a message to ${user.username}: ${e}`))
        .then(() => notificationIdsToRemove.length > 0 && q.all([
            db['users.notifications'].removeWhere({_id: {$in: notificationIdsToRemove}}),
            db.users.update({_id: user._id}, {$set: {lastNotifyDate: Date.now()}})
        ]))
      });
      return promise;
    });
}

module.exports = function(config){
  config.cronjobs = {
    sendNotifications: [30, () => sendNotifications(config)]
  };

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
    sendMessage(discordBot.testUsername, "Screeps is online");
    console.log("connected to discord");
  });
  client.on('error', (e) => {
    console.error("unable to connect to discord", e);
  });
}