import { ChannelType, GuildMember } from "discord.js";

export const handleMemberJoin = async (member: GuildMember) => {
  console.log("New guide member");
  const channel = member.guild.channels.cache.get("1141594176874623076");
  if (!channel) {
    return;
  }

  if (channel.type !== ChannelType.GuildText) return;

  channel.send(`Welcome to the server, ${member.user.tag}`);
  member.send(
    "Welcome to the server! Please answer the following questions..."
  );
};
