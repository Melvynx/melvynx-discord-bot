import { ChannelType, Client, GuildMember, Message } from "discord.js";
import { readFileSync } from "fs";

type UserQuestionState = {
  state: number;
  info: Record<string, string | boolean> & {
    isWarned?: boolean;
    currentActivity?: string;
    previousActivity?: string;
    freelance?: boolean;
    indie?: boolean;
    creator?: boolean;
  };
  kickDate?: Date;
};

export const userQuestionState = new Map<string, UserQuestionState>();

const resetUserState = (userId: string) => {
  console.trace(`Reset user state: ${userId}`);
  userQuestionState.set(userId, { state: 1, info: {} });
};

const setUserKickDate = (userId: string) => {
  console.log("setUserKickDate", userId);
  const userState = userQuestionState.get(userId);

  if (!userState) return;

  userState.kickDate = new Date();
  userState.info.isWarned = false;
  userQuestionState.set(userId, userState);
};

const failedQuiz = async (member: GuildMember, channel: Message["channel"]) => {
  await member
    .kick("Failed the quiz.")
    .catch((err: unknown) =>
      console.log("Failed to kick member due to: ", err)
    );

  await channel.send("Je suis désolé, c'est une mauvaise réponse. Tu peux retenter ta chance dans 5 minutes.");
  setUserKickDate(member.id);
};

export const handlePrivateMessageQuiz = async (msg: Message, client: Client) => {
  if (msg.channel.type !== ChannelType.DM) return;
  if (!process.env.GUILD_ID || !process.env.WELCOME_CHANNEL_ID) {
    console.error("Environment variables: GUILD_ID, WELCOME_CHANNEL_ID are required.");
    return;
  }

  const user = await client.users.fetch(msg.author.id);

  if (!user) {
    console.log("No user found.");
    return;
  }

  const content = msg.content.toLowerCase();
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  const member = guild?.members.cache.get(user.id);
  const userId = user.id;
  const userState = userQuestionState.get(userId);
  let questionState = userState?.state || 0;

  if (msg.author.bot) {
    if (userState) {
      const kickDate = userState.kickDate;
      console.log("kickDate", kickDate);
      if (!kickDate) return;

      if (isRecentlyKicked(kickDate) && !userState.info.isWarned) {
        userState.info.isWarned = true;
        await msg.channel.send(
          "Tu as été exclu il y a moins de 5 minutes. Il te faut patienter pendant 5 minutes avant de pouvoir réintégrer le groupe. Après ce délai, n'hésite pas à m'envoyer un message."
        );
        return;
      }

      if (userState.state === 1) {
        return;
      }
    }

    resetUserState(userId);
    console.log("Reset user state.");

    const one = readFileSync("./resources/questions/1.txt", "utf-8");
    msg.channel.send(one);
    return;
  } else {
    if (userState?.kickDate && isRecentlyKicked(userState.kickDate)) {
      userState.info.isWarned = true;
      await msg.channel.send(
        "Tu as été kick il y a moins de 5 minutes. Tu dois attendre 5 minutes avant de pouvoir revenir. Dans 5 minutes, envoie moi un message."
      );
      return;
    }
  }

  console.log(user, userState, member);
  if (!user || !userState || !member) {
    msg.channel.send("Tu n'est pas un membre du serveur, contacte Melvyn si tu as un problème.");
    return;
  }

  switch (questionState) {
    case 1:
      if (content.toLocaleLowerCase() === "react") {
        userState.state = 2;
        userQuestionState.set(user.id, userState);
        msg.channel.send(readFileSync("./resources/questions/2.txt", "utf-8"));
      } else {
        failedQuiz(member, msg.channel);
      }
      break;

    case 2:
      if (content === "b") {
        userState.state = 3;
        userQuestionState.set(user.id, userState);
        msg.channel.send(readFileSync("./resources/questions/3.txt", "utf-8"));
      } else {
        failedQuiz(member, msg.channel);
      }
      break;
    case 3:
      if (content.length >= 26) {
        userState.state = 4;
        userState.info.currentActivity = content;
        userQuestionState.set(user.id, userState);
        msg.channel.send(readFileSync("./resources/questions/4.txt", "utf-8"));
      } else {
        msg.channel.send(":x: Votre réponse doit avoir au moins 26 caractères, réessayez.");
      }
      break;
    case 4:
      if (content.length >= 26) {
        userState.state = 5;
        userState.info.previousActivity = content;
        userQuestionState.set(user.id, userState);
        msg.channel.send(readFileSync("./resources/questions/5.txt", "utf-8"));
      } else {
        msg.channel.send(":x: Encore ? Mais pourtant c'est pas compliqué, 26 caractères minimum.");
      }
      break;

    case 5:
      if (content.toLocaleLowerCase() == ("oui" || "non")) {
        if (content === "oui") {
          if (!member.guild.roles.cache.has("1141597909767438397")) {
            msg.channel.send(":x: Une erreur est survenue, le rôle n'existe pas.");
            return;
          }

          member.roles.add("1141597909767438397");
          userState.info.freelance = true;
        }

        userState.state = 6;
        userQuestionState.set(user.id, userState);
        msg.channel.send(readFileSync("./resources/questions/6.txt", "utf-8"));
      } else {
        msg.channel.send(":x: Réponse invalide. Veuillez répondre par 'oui' ou 'non'.");
      }
      break;

    case 6:
      if (content.toLocaleLowerCase() == ("oui" || "non")) {
        if (content === "oui") {
          if (!member.guild.roles.cache.has("1141597934450905128")) {
            msg.channel.send(":x: Une erreur est survenue, le rôle n'existe pas.");
            return;
          }

          member.roles.add("1141597934450905128");
          userState.info.indie = true;
        }
        
        userState.state = 7; // Move to next question or end of quiz
        userQuestionState.set(user.id, userState);
        msg.channel.send(readFileSync("./resources/questions/7.txt", "utf-8"));
      } else {
        msg.channel.send(":x: Tu le fais exprès ? Répond par 'oui' ou 'non'.");
      }
      break;
    case 7:
      if (content.toLocaleLowerCase() == ("oui" || "non")) {
        if (content === "oui") {
          if (!member.guild.roles.cache.has("1141597957666373643")) {
            msg.channel.send(":x: Une erreur est survenue, le rôle n'existe pas.");
            return;
          }
          member.roles.add("1141597957666373643");
          userState.info.creator = true;
        }

        userState.state = 8;
        msg.channel.send(readFileSync("./resources/questions/8.txt", "utf-8"));
      } else {
        msg.channel.send(":x: Tu devrais aller t'acheter des lunettes, je t'ai demandé de répondre par 'oui' ou 'non'.");
      }

      break;
    case 8:
      if (content !== "non") {
        if (!member.guild.roles.cache.has("1141597501258997810")) {
          msg.channel.send(":x: Une erreur est survenue, le rôle n'existe pas.");
          return;
        }

        member.roles.add("1141597501258997810");
      }

      msg.channel.send(readFileSync("./resources/questions/9.txt", "utf-8"));
      if (!member.guild.roles.cache.has("1141600989808443423")) {
        msg.channel.send(":x: Une erreur est survenue, le rôle n'existe pas.");
        return;
      }

      member.roles.add("1141600989808443423");

      const welcomeChannel = guild?.channels.cache.get(process.env.WELCOME_CHANNEL_ID || "");
      if (welcomeChannel?.type === ChannelType.GuildText) {

        const text = readFileSync("./resources/welcome.txt", "utf-8")
          .replace("{userId}", user.id)
          .replace("{currentActivity}", userState.info.currentActivity || "Aucune")
          .replace("{previousActivity}", userState.info.previousActivity || "Aucune")
          .replace("{interests}", `
            ${userState.info.freelance ? "\n `👨‍💻` Freelance" : ""}
            ${userState.info.indie ? "\n `🚀` Création de SaaS" : ""}
            ${userState.info.creator ? "\n `📝` Création de contenu" : ""}`
          );

        const message = await welcomeChannel.send(text);

        const thread = await message.startThread({
          name: `Bienvenue ${user.username}`,
          autoArchiveDuration: 1440,
        });

        thread.send(`Bienvenue <@${user.id}> ❤️ (de Melvynx)`);
      }

      userQuestionState.delete(user.id);
      break;

    default:
      msg.channel.send("Invalid state.");
  }
};
