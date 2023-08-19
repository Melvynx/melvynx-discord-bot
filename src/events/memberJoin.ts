import { ChannelType, GuildMember } from "discord.js";
import { readFileSync } from "fs";
import { getMessageState, getUser, isRecentlyKicked, startQuiz, users } from "../data/users";
import { startQuizButton } from "../utils/embed";
import dayjs, { Dayjs } from "dayjs";

export const handleMemberJoin = async (member: GuildMember) => {
  const channel = await member.guild.channels.create({
    name: member.user.username,
    type: ChannelType.GuildText,
    position: 0,
    permissionOverwrites: [
      { id: member.guild.id, deny: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
      { id: member.id, allow: ["ViewChannel", "ReadMessageHistory", "SendMessages"] }
    ]
  });

  let TTS = isRecentlyKicked(member.id) ? "kicked" : "info";

  const message = await channel.send({
    content: readFileSync(`./resources/${TTS}.txt`, "utf-8")
      .replace("{userId}", member.id)
      .replace("{time}", ((getUser(member.id)?.canRestart || dayjs().add(parseInt(process.env.TIME_TO_WAIT_AFTER_KICK ?? "5"), "minute").unix())).toString()),
    components: [{
      type: 1,
      components: [startQuizButton(TTS === "kicked")]
    }]
  });

  if (TTS === "kicked") {
    setInterval(() => {
      if (dayjs().unix() > getUser(member.id)?.canRestart!) {
        message.edit({
          content: readFileSync(`./resources/info.txt`, "utf-8")
            .replace("{userId}", member.id)
            .replace("{time}", ((getUser(member.id)?.canRestart || dayjs().add(parseInt(process.env.TIME_TO_WAIT_AFTER_KICK ?? "5"), "minute").unix())).toString()),
          components: [{
            type: 1,
            components: [startQuizButton(false)]
          }]
        });

        clearInterval(this);
      }
    }, 1000);
  }

  setTimeout(() => {
    if (!users.find((u) => u.userId === member.id)?.quizStarted) {
      channel.delete();
      try {
        member.send({
          content: "Vous avez été expulsé du serveur car vous n'avez pas démarré le quiz à temps.",
          components: []
        });
      } catch {
        console.log("Member has DMs disabled");
      }

      member.kick();
    }
  }, 3600000);

  message.createMessageComponentCollector({ filter: (i) => i.customId === "start_quiz" }).on("collect", async (i) => {
    await i.deferUpdate();
    startQuiz(member.id);
    await i.editReply({
      content: getMessageState(member.id),
      components: []
    });
  });

  users.push({
   channelId: channel.id,
   userId: member.id,
   quizStarted: false,
   data: {
    state: "MELVYNX_LOVE_STACK"
   }
  });
};