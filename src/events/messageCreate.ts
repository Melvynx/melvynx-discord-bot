import { ChannelType, Client, Message } from "discord.js";
import {
  endQuiz,
  getMessageState,
  getState,
  getUser,
  saveResponse,
  setRecentlyKicked,
} from "../data/users";
import { readFileSync } from "fs";
import { redisClient } from "../client";
import dayjs from "dayjs";

export const handleMessageCreate = async (message: Message, client: Client) => {
  if (message.author.bot) return;
  await redisClient.set(message.author.id, dayjs().unix().toString());

  const user = getUser(message.author.id);
  if (!user) return;
  if (!user.quizStarted) return;
  if (message.channelId !== user.channelId) return;

  const member = message.guild?.members.cache.get(message.author.id);
  if (!member) return;

  const state = getState(message.author.id);
  let newState: ReturnType<typeof saveResponse> = "MELVYNX_LOVE_STACK";

  if (state === "USER_NAME") {
    newState = saveResponse(message.author.id, message.content, client);
  }

  if (state === "AFTER" || state === "BEFORE") {
    if (message.content.length < 26) {
      await message.reply({
        content:
          "Votre réponse est trop courte, merci de répondre avec au moins 26 caractères.",
      });
      return;
    }

    newState = saveResponse(message.author.id, message.content, client);
  }

  if (state == "MELVYNX_LOVE_STACK" || state === "CODE") {
    if (
      (state === "MELVYNX_LOVE_STACK" &&
        message.content.toLowerCase() !== "react") ||
      (state === "CODE" && message.content.toLowerCase() !== "b")
    ) {
      await setRecentlyKicked(message.author.id, member);
      return;
    }

    newState = saveResponse(
      message.author.id,
      message.content.toLowerCase(),
      client
    );
  }

  if (
    state === "FREELANCE" ||
    state === "INDIE" ||
    state === "CREATOR" ||
    state === "MELVYNX_NEED_YOU"
  ) {
    if (
      message.content.toLowerCase() !== "oui" &&
      message.content.toLowerCase() !== "non"
    ) {
      await message.reply({
        content:
          "Merci de répondre seulement par `oui` ou `non`, autre chose ne sera pas pris en compte.",
      });
      return;
    }

    newState = saveResponse(
      message.author.id,
      message.content.toLowerCase(),
      client
    );
  }

  if (newState === "ERROR") {
    await message.reply({
      content: "Une erreur est survenue, merci de réessayer plus tard.",
    });
    return;
  } else if (newState === "DONE") {
    await message.reply({content: getMessageState(message.author.id)});
    endQuiz(message.author.id);
    setTimeout(() => {
      message.channel.delete();
    }, 5000);

    const welcomeChannel = message.guild?.channels.cache.get(
      process.env.WELCOME_CHANNEL_ID!
    );
    if (!welcomeChannel) return;
    if (welcomeChannel.type !== ChannelType.GuildText) return;

    const interests = [];
    if (user.data.info?.freelance) interests.push("`👨‍💻` Freelance");
    if (user.data.info?.indie) interests.push("`🚀` Création de SaaS");
    if (user.data.info?.creator) interests.push("`📝` Création de contenu");
    if (interests.length === 0)
      interests.push("Aucun intérêt a été renseigné.");

    await member.roles.add(process.env.MEMBER_ROLE_ID!);

    const text = readFileSync("./resources/welcome.txt", "utf-8");

    const welcomeMessage = await welcomeChannel.send(
      replaceAll(
        {
          "{userId}": user.userId,
          "{currentActivity}": user.data.info?.currentActivity || "Aucune",
          "{previousActivity}": user.data.info?.previousActivity || "Aucune",
          "{interests}": `${interests.join(" ")}`,
        },
        text
      )
    );

    const thread = await welcomeMessage.startThread({
      name: `Bienvenue ${message.author.username}`,
      autoArchiveDuration: 1440,
    });

    thread.send(`Bienvenue <@${user.userId}> ❤️ (de Melvynx)`);
  } else {
    await message.reply({content: getMessageState(message.author.id)});
  }
};

export const replaceAll = (
  repl: { [key: string]: string },
  str: string
): string => {
  for (const [key, value] of Object.entries(repl)) {
    str = str.replaceAll(key, value);
  }

  return str;
};
