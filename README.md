# screeps-discord

## How it works

The bot will find all the users in the authenticated channel. It will match against any user who's name or channel nickname match their screeps username.

## Create an bot

See https://discordpy.readthedocs.io/en/latest/discord.html

## Add the following configs to config.yml

```yml
discordBot:
  token=your_bot_token # from discord at https://discordapp.com/developers/applications/
  testUsername=your_discord_username # used for testing 
```

## Testing

If you properly set the discordBot.testUsername config, you will recieve a "Screeps is online" message to your discord username.