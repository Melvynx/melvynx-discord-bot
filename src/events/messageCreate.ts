import { ChannelType, Client, Message } from "discord.js";
import { endQuiz, getMessageState, getState, getUser, saveResponse, setRecentlyKicked } from "../data/users";
import { readFileSync } from "fs";

export const handleMessageCreate = async (message: Message, client: Client) => {
  if (message.author.bot) return;
  if (!getUser(message.author.id)?.quizStarted) return;
  if (message.channelId !== getUser(message.author.id)?.channelId) return;

  const user = getUser(message.author.id);
  if (!user) return;

  const member = message.guild?.members.cache.get(message.author.id);
  if (!member) return;

  const state = getState(message.author.id);
  let newState: ReturnType<typeof saveResponse> = "MELVYNX_LOVE_STACK";

  if (state === "AFTER" || state === "BEFORE") {
    if (message.content.length < 26) {
      message.reply({
        content: "Votre réponse est trop courte, merci de répondre avec au moins 26 caractères."
      });
      return;
    }

    newState = saveResponse(message.author.id, message.content, client);
  }

  if (state == "MELVYNX_LOVE_STACK" || state === "CODE") {
    if (
      (state === "MELVYNX_LOVE_STACK" && message.content.toLowerCase() !== "react") ||
      (state === "CODE" && message.content.toLowerCase() !== "b")
    ) {
      await setRecentlyKicked(message.author.id, member);
      return;
    }

    newState = saveResponse(message.author.id, message.content.toLowerCase(), client);
  }

  if (state === "FREELANCE" || state === "INDIE" || state === "CREATOR" || state === "MELVYNX_NEED_YOU") {
    if (message.content.toLowerCase() !== "oui" && message.content.toLowerCase() !== "non") {
      message.reply({
        content: "Merci de répondre seulement par `oui` ou `non`, autre chose ne sera pas pris en compte."
      });
      return;
    }

    newState = saveResponse(message.author.id, message.content.toLowerCase(), client);
  }

  if (newState === "ERROR") {
    message.reply({
      content: "Une erreur est survenue, merci de réessayer plus tard."
    });
    return;
  } else if (newState === "DONE") {
    message.reply({ content: getMessageState(message.author.id) });
    endQuiz(message.author.id, client);
    setTimeout(() => {
      message.channel.delete();
    }, 5000);

    const welcomeChannel = message.guild?.channels.cache.get(process.env.WELCOME_CHANNEL_ID!);
    if (!welcomeChannel) return;
    if (welcomeChannel.type !== ChannelType.GuildText) return;

    const interests = [];
    if (user.data.info?.freelance) interests.push("`👨‍💻` Freelance");
    if (user.data.info?.indie) interests.push("`🚀` Création de SaaS");
    if (user.data.info?.creator) interests.push("`📝` Création de contenu");
    if (interests.length === 0) interests.push("Aucun intérêt a été renseigné.");

    member.roles.add(process.env.MEMBER_ROLE_ID!);

    const text = readFileSync("./resources/welcome.txt", "utf-8")
      .replace("{userId}", user.userId)
      .replace("{currentActivity}", user.data.info?.currentActivity || "Aucune")
      .replace("{previousActivity}", user.data.info?.previousActivity || "Aucune")
      .replace("{interests}", `${interests.join(" ")}`);

    const welcomeMessage = await welcomeChannel.send(text);
    const thread = await welcomeMessage.startThread({
      name: `Bienvenue ${message.author.username}`,
      autoArchiveDuration: 1440
    });

    thread.send(`Bienvenue <@${user.userId}> ❤️ (de Melvynx)`);
  } else {
    message.reply({ content: getMessageState(message.author.id) });
  }
};