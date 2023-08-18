![Group 4 (2)](https://github.com/SteellgoldStock/MelvynxBot/assets/51505384/b1c3dbae-0cc5-4619-aab7-b30a3c52614a)

## How to run ?
Install the dependencies
```
pnpm install
npm install
```

And run the bot

```
pnpm run dev
npm run dev
```

## Environment variables (`.env` file)
```
GUILD_ID="<your guild id>"
BOT_TOKEN="<your bot token>"
WELCOME_CHANNEL_ID="<your welcome channel id>"
```

## How it works ?
The bot will create a channel for each user who joins the server and will send a message in the welcome channel.

Each message contains a button to start (and send) the little quiz for join the server.

In MP the bot will send a message to the user for each question and will wait for the answer.

At the end of the quiz, user now access to the server and the bot will delete the temporary channel and a presentation message will be send in the welcome channel ! (A thread will be created automatically for the presentation message)