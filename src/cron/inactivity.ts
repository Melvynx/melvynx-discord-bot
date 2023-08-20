import "dotenv/config";

import { CronJob } from "cron";
import { client, redisClient } from "../client";
import dayjs from "dayjs";
import { ButtonBuilder, ButtonStyle } from "discord.js";

export const inactivityJob = new CronJob("0 0 1 * *", async() => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) return;

  guild.members.fetch().then(async(members) => {
    members.forEach(async(member) => {
      if (member.user.bot) return;

      if (!redisClient.get(member.id)) return;
  
      const redisDate = await redisClient.get(member.id);
      if (!redisDate) {
        redisClient.set(member.id, dayjs().unix().toString());
        return;
      }
  
      const date = dayjs.unix(parseInt(redisDate));
      const now = dayjs();
  
      const diff = now.diff(date, "month");
  
      if (diff === 2) {
        await member.send({
          content: "Vous êtes inactif depuis 2 mois, vous devriez parler un peu plus souvent et établir des relations avec les autres membres du serveur."
        }).catch(() => console.log(`Member ${member.displayName} has DMs disabled (3 months)`));
  
        return;
      }
  
      if (diff === 3) {
        await member.send({
          content: "Vous êtes toujours là ? Vous êtes inactif depuis 3 mois, on vous a pas vu depuis un moment, vous devriez venir plus souvent."
        }).catch(() => console.log(`Member ${member.displayName} has DMs disabled (4 months)`));
  
        return;
      }
  
      if (diff === 4) {
        const button = new ButtonBuilder()
          .setURL("https://discord.gg/perFqfBCRt")
          .setLabel("Rejoindre le serveur")
          .setStyle(ButtonStyle.Link);
  
        await member.send({
          content: "Vous êtes inactif depuis 6 mois, malheureusement nous avons dû vous retirer du serveur. Vous pouvez toujours revenir en utilisant le lien d'invitation.",
          components: [{ type: 1, components: [button] }]
        }).catch(() => console.log(`Member ${member.displayName} has DMs disabled (6 months)`));
  
        member.kick();
        return;
      }
    });
  });
});