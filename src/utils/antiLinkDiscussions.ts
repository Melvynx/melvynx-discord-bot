import { ChannelType, Message, ThreadAutoArchiveDuration } from "discord.js";

const parseTitle = (body: string): string => {
  let match = body.match(/<title>([^<]*)<\/title>/);
  if (!match || typeof match[1] !== 'string') {
    console.log("don't found title !");
    return "no title found for website"
  }
  return match[1]
}

export const handleAntiLinkDiscussions = async (message: Message): Promise<void> => {
  try {

    if (message.author.bot) {
      return;
    }

    if (message.guildId !== process.env.GUILD_ID || message.channelId !== process.env.LINKS_CHANNEL_ID) {
      return;
    }

    if (message.channel.type !== ChannelType.GuildText) {
      console.error("invalid channel");
      return;
    }

    const urlRegex = new RegExp(/(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/, "g");

    const url = urlRegex.exec(message.content);

    if (!url) {
      const msg = await message.reply("Votre message ne contient pas de lien, merci de répondre dans le fil en question." +
        " et de supprimer votre message.");
      setTimeout(() => {
        void msg.delete();
      }, 60 * 1000)

      return;
    }

    const site = await fetch(url[0]);
    let title = parseTitle(await site.text());

    if (title.length >= 99) {
      title = title.slice(0, 96) + "...";
    }

    await message.startThread({
      name: title,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });

  } catch (e) {
    console.error(e);
  }
};