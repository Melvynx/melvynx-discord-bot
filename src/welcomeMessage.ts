import { ChannelType, GuildMember } from "discord.js";

export const handleMemberJoin = async (member: GuildMember) => {
  console.log("New guide member");
  const channel = member.guild.channels.cache.get("1141594176874623076");
  if (!channel) {
    return;
  }

  if (channel.type !== ChannelType.GuildText) return;

  channel.send(`Hello <@${member.id}>!
  
Pour pouvoir rejoindre le server et avoir accès à tous les channels, tu dois répondre à quelques questions que je t'envoie en privé !`);
  member.send(
    `Hello ! C'est ici que ça se passe. Afin d'éviter d'avoir des bots / troll / spam qui viennent sur le server, et pour garentir des membres actif et déterminé, on va prendre quelques minutes pour faire connaissance.`
  );
};
