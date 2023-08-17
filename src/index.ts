import "dotenv/config";

import { Client, GatewayIntentBits } from "discord.js";
import { channelsByUser, handleMemberJoin } from "./welcomeMessage";
import { handlePrivateMessageQuiz } from "./privateMessageQuiz";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const BOT_TOKEN = process.env.BOT_TOKEN;

client.on("ready", () => {
  setInterval(() => {
    if (channelsByUser.size === 0) return;
  }, 1000);

  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("guildMemberAdd", handleMemberJoin);
client.on("messageCreate", async (msg) => {
  handlePrivateMessageQuiz(msg, client);
});

client.login(BOT_TOKEN);
