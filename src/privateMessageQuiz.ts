import { ChannelType, Client, GuildMember, Message } from "discord.js";
import { readFileSync } from "fs";
import { deleteUserState, getUserState, resetUserState, setUserKickDate, setUserState } from "./utils/state";
import { channelsByUser } from "./welcomeMessage";

const failedQuiz = async (member: GuildMember, channel: Message["channel"]) => {
  await channel.send("Je suis désolé, c'est une mauvaise réponse. Tu peux retenter ta chance dans 5 minutes. (<t:{t}:f>)"
    .replace("{t}", String(Math.ceil((Date.now() + 5 * 60 * 1000) / 1000))))
    .catch(console.error);
    await member
    .kick("Failed the quiz.")
    .catch((err: unknown) =>
      console.log("Failed to kick member due to: ", err)
    );
  setUserKickDate(member.id);
};

export const handlePrivateMessageQuiz = async (msg: Message, client: Client) => {
  if (msg.channel.type !== ChannelType.DM) return;
  if (!process.env.GUILD_ID || !process.env.WELCOME_CHANNEL_ID) {
    console.error("Environment variables: GUILD_ID, WELCOME_CHANNEL_ID are required.");
    return;
  }

  const user = msg.author.bot ? msg.channel.recipient : msg.author;

  if (!user) {
    console.log("No user found.");
    return;
  }

  const content = msg.content.toLowerCase();
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  const member = guild?.members.cache.get(user.id);
  const userId = user.id;
  const userState = getUserState(userId);
  console.log("userStateeeeeeeeee", userState);

  let questionState = userState?.state || 0;

  const text = "Tu as été exclu il y a moins de 5 minutes. Il te faut patienter pendant jusqu'à <t:{m}:f> minutes avant de pouvoir réintégrer le groupe. Après ce délai, n'hésite pas à m'envoyer un message.";
  
  if (msg.author.bot) {
    if (userState) {
      const kickDate = userState.kickDate;
      if (!kickDate) return;

      if (isRecentlyKicked(kickDate) && !userState.info.isWarned) {
        userState.info.isWarned = true;
        if (!userState.kickDate) return;

        await msg.reply(text.replace("{m}", String(Math.ceil((userState.kickDate.getTime() + 5 * 60 * 1000 - Date.now()) / 1000 / 60))));
        return;
      }

      if (userState.state === 1) return;
    }

    resetUserState(userId);
    msg.reply(readFileSync("./resources/questions/1.txt", "utf-8"));
    return;
  } else {
    if (userState?.kickDate && isRecentlyKicked(userState.kickDate)) {
      userState.info.isWarned = true;
      await msg.reply(
        text.replace("{m}", String(Math.ceil((userState.kickDate.getTime() + 5 * 60 * 1000 - Date.now()) / 1000 / 60)))
      );
      return;
    }
  }

  if (!user) {
    msg.channel.send("You are not a member of the server.");
    return;
  }

  if (!userState) {
    msg.channel.send("You are not a member of the server.");
    return;
  }

  if (!member) {
    msg.channel.send("You are not a member of the server.");
    return;
  }

  switch (questionState) {
    case 1:
      if (content.toLocaleLowerCase() === "react") {
        userState.state = 2;
        setUserState(user.id, userState);
        msg.reply(readFileSync("./resources/questions/2.txt", "utf-8"));
      } else {
        failedQuiz(member, msg.channel);
      }
      break;

    case 2:
      if (content === "b") {
        userState.state = 3;
        setUserState(user.id, userState);
        msg.reply(readFileSync("./resources/questions/3.txt", "utf-8"));
      } else {
        failedQuiz(member, msg.channel);
      }
      break;
    case 3:
      if (content.length >= 26) {
        userState.state = 4;
        userState.info.currentActivity = content;
        setUserState(user.id, userState);
        msg.reply(readFileSync("./resources/questions/4.txt", "utf-8"));
      } else {
        msg.reply(":x: Votre réponse doit avoir au moins 26 caractères, réessayez.");
      }
      break;
    case 4:
      if (content.length >= 26) {
        userState.state = 5;
        userState.info.previousActivity = content;
        setUserState(user.id, userState);
        msg.reply(readFileSync("./resources/questions/5.txt", "utf-8"));
      } else {
        msg.reply(":x: Encore ? Mais pourtant c'est pas compliqué, 26 caractères minimum.");
      }
      break;

    case 5:
      if (content.toLocaleLowerCase() == "oui" || content.toLocaleLowerCase() == "non") {
        if (content === "oui") {
          if (!member.guild.roles.cache.has("1141597909767438397")) {
            msg.reply(":x: Le role n'a pas pu vous être attribué, veuillez contacter <@111448653142515712>.");
          } else {
            member.roles.add("1141597909767438397");
          }
          userState.info.freelance = true;
        }

        userState.state = 6;
        setUserState(user.id, userState);
        msg.reply(readFileSync("./resources/questions/6.txt", "utf-8"));
      } else {
        msg.reply(":x: Réponse invalide. Veuillez répondre par 'oui' ou 'non'.");
      }
      break;

    case 6:
      if (content.toLocaleLowerCase() == "oui" || content.toLocaleLowerCase() == "non") {
        if (content === "oui") {
          if (!member.guild.roles.cache.has("1141597934450905128")) {
            msg.reply(":x: Le role n'a pas pu vous être attribué, veuillez contacter <@111448653142515712>.");
          } else {
            member.roles.add("1141597934450905128");
          }

          userState.info.indie = true;
        }
        
        userState.state = 7;
        setUserState(user.id, userState);
        msg.reply(readFileSync("./resources/questions/7.txt", "utf-8"));
      } else {
        msg.reply(":x: Tu le fais exprès ? Répond par 'oui' ou 'non'.");
      }
      break;
    case 7:
      if (content.toLocaleLowerCase() == "oui" || content.toLocaleLowerCase() == "non") {
        if (content === "oui") {
          if (!member.guild.roles.cache.has("1141597957666373643")) {
            msg.reply(":x: Le role n'a pas pu vous être attribué, veuillez contacter <@111448653142515712>.");
          } else {
            member.roles.add("1141597957666373643");
          }

          userState.info.creator = true;
        }

        userState.state = 8;
        msg.reply(readFileSync("./resources/questions/8.txt", "utf-8"));
      } else {
        msg.reply(":x: Tu devrais aller t'acheter des lunettes, je t'ai demandé de répondre par 'oui' ou 'non'.");
      }

      break;
    case 8:
      if (content !== "non") {
        if (!member.guild.roles.cache.has("1141597501258997810")) {
          msg.reply(":x: Le role n'a pas pu vous être attribué, veuillez contacter <@111448653142515712>.");
        } else {
          member.roles.add("1141597501258997810");
        }
      }

      msg.reply(readFileSync("./resources/questions/9.txt", "utf-8"));
      if (!member.guild.roles.cache.has("1141600989808443423")) {
        msg.reply(":x: Le role n'a pas pu vous être attribué, veuillez contacter <@111448653142515712>.");
      } else {
        member.roles.add("1141600989808443423");
      }

      const welcomeChannel = guild?.channels.cache.get(process.env.WELCOME_CHANNEL_ID || "");
      if (welcomeChannel?.type === ChannelType.GuildText) {
        const interests = [];
        if (userState.info.freelance) interests.push("`👨‍💻` Freelance");
        if (userState.info.indie) interests.push("`🚀` Création de SaaS");
        if (userState.info.creator) interests.push("`📝` Création de contenu");
        if (interests.length === 0) interests.push("Aucun intérêt a été renseigné.");

        const text = readFileSync("./resources/welcome.txt", "utf-8")
          .replace("{userId}", user.id)
          .replace("{currentActivity}", userState.info.currentActivity || "Aucune")
          .replace("{previousActivity}", userState.info.previousActivity || "Aucune")
          .replace("{interests}", `${interests.join(" ")}`);

        const message = await welcomeChannel.send(text);

        const thread = await message.startThread({
          name: `Bienvenue ${user.username}`,
          autoArchiveDuration: 1440,
        });

        thread.send(`Bienvenue <@${user.id}> ❤️ (de Melvynx)`);
      }

      const channelId = channelsByUser.find((c) => c.userId === user.id);
      if (!channelId) return;
      const channel = guild?.channels.cache.get(channelId.channelId);
      if (!channel) return;
      channel.delete(); 

      deleteUserState(user.id);
      break;
    default:
      msg.reply("Invalid state.");
  }
};
