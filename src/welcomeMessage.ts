import { ButtonBuilder, ButtonStyle, ChannelType, GuildMember } from "discord.js";
import { userQuestionState } from "./privateMessageQuiz";

type ChannelByUser = Map<string, string>;

export const channelsByUser: ChannelByUser = new Map();

export const handleMemberJoin = async (member: GuildMember) => {
  console.log(`New member joined: ${member.user.username}`);

  let message = `:wave: <@${member.id}>!\n\n`;
  message += `Afin de pouvoir accéder au serveur et à l'ensemble des salons, il te faudra répondre à __quelques questions__ que je t'enverrai en message privé dès que tu aura cliqué sur le bouton ci-dessous.\n\n`;
  message += `(i) Vérifie que tu as bien activé les messages privés dans les paramètres du serveur, sinon fort malheureusement tu ne pourras pas accéder au serveur.`;

  let errorTime = "Tu as été exclu il y a moins de 5 minutes. Il te faut patienter pendant 5 minutes avant de pouvoir réintégrer le groupe. Après ce délai, n'hésite pas à m'envoyer un message.";

  const button = (disabled: boolean) => new ButtonBuilder()
    .setCustomId("start_quiz")
    .setLabel("Commencer le mini-quiz")
    .setStyle(ButtonStyle.Primary)
    .setEmoji("🪪")
    .setDisabled(disabled);

  if (userQuestionState.has(member.id)) {
    const userState = userQuestionState.get(member.id);
    const kickDate = userState?.kickDate;
    if (!kickDate) return;
    if (isRecentlyKicked(kickDate) && !userState.info.isWarned) {
      userState.info.isWarned = true;
      member.send(errorTime).catch(console.error);
      member.kick("Recently kicked").catch(console.error);
      return;
    }
  }

  await member.guild.channels.create({
    name: member.user.username,
    type: ChannelType.GuildText,
    position: 0,
    permissionOverwrites: [
      { id: member.guild.id, deny: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
      { id: member.id, allow: ["ViewChannel", "ReadMessageHistory"], deny: ["SendMessages"] },
    ]
  }).catch(console.error).then(async(channel) => {
    if (!channel) return;
    channelsByUser.set(member.id, channel.id);
    const msgSended = await channel.send({
      content: message,
      components: [{ type: 1, components: [button(false)] }]
    }).catch(console.error);

    if (!msgSended) return;
    msgSended.createMessageComponentCollector({ filter: (i) => i.customId === "start_quiz" }).on("collect", async (i) => {
      await i.deferUpdate();
      await i.editReply({
        content: "Si tout c'est bien déroulé, tu devrais recevoir un message privé de ma part. Si ce n'est pas le cas, vérifie que tu as bien activé les messages privés dans les paramètres du serveur :wink:",
        components: [{ type: 1, components: [button(true)] }]
      }).catch(console.error);

      const user = await member.guild.members.fetch(member.id);
      if (!user) return;

      user.send("Salut ! :wave:\n\nJe vais te poser quelques questions afin de vérifier que tu n'est pas un bot ou un troll. Si tu as des questions, n'hésite pas à m'envoyer un message (<@111448653142515712>)")
        .catch(console.error);
    });
  });
};
