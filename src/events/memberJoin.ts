import type { GuildMember } from "discord.js";
import { ChannelType } from "discord.js";
import { readFileSync } from "fs";
import {
  getMessageState,
  getUser,
  isRecentlyKicked,
  startQuiz,
  users,
} from "../data/users";
import { startQuizButton } from "../utils/embed";
import dayjs from "dayjs";
import { redisClient } from "../client";

export const handleMemberJoin = async (member: GuildMember): Promise<void> => {
  const verifyChannel = member.guild.channels.cache.get(process.env.VERIFY_CHANNEL_ID!);
  if (!verifyChannel) return;
  if (verifyChannel.type !== ChannelType.GuildText) return;

  const channel = await verifyChannel.threads.create({
    name: member.user.username,
    type: ChannelType.PrivateThread,
    invitable: false,
  });

  await channel.members.add(member.id);

  const TTS = isRecentlyKicked(member.id) ? "kicked" : "info";
  const canRestart = dayjs()
    .add(parseInt(process.env.TIME_TO_WAIT_AFTER_KICK ?? "5"), "minute")
    .unix();

  const message = await channel.send({
    content: readFileSync(`./resources/${TTS}.txt`, "utf-8")
      .replace("{userId}", member.id)
      .replace("{time}", canRestart.toString()),
    components: [
      {
        type: 1,
        components: [startQuizButton(TTS === "kicked")],
      },
    ],
  });

  if (TTS === "kicked") {
    const interval = setInterval(async () => {
      try {
        const user = getUser(member.id);
        if (user?.canRestart && dayjs().unix() > user.canRestart) {
          await message.edit({
            content: readFileSync("./resources/info.txt", "utf-8")
              .replace("{userId}", member.id)
              .replace("{time}", canRestart.toString()),
            components: [
              {
                type: 1,
                components: [startQuizButton(false)],
              },
            ],
          });

          clearInterval(interval);
        }
      } catch (e) {
        console.error(e);
      }
    }, 1000);
  }

  setTimeout(async () => {
    try {
      const user = getUser(member.id);
      if (!user?.quizStarted) {
        await channel.delete();
        await member
          .send({
            content:
              "Vous avez été expulsé du serveur car vous n'avez pas démarré le quiz à temps.",
            components: [],
          })
          .catch(() => console.log("Member has DMs disabled"));

        await member.kick();
      }
    } catch (e) {
      console.error(e);
    }
  }, 3600000);

  message
    .createMessageComponentCollector({
      filter: (i) => i.customId === "start_quiz",
    })
    .on("collect", async (i) => {
      await i.deferUpdate();
      startQuiz(member.id);
      await redisClient.set(member.id, dayjs().unix().toString());
      await i.editReply({
        content: getMessageState(member.id),
        components: [],
      });
    });

  const user = getUser(member.id);

  if (user) {
    user.channelId = channel.id;
  } else {
    users.set(member.id, {
      channelId: channel.id,
      userId: member.id,
      quizStarted: false,
      data: {
        state: "MELVYNX_LOVE_STACK",
        info: {
          creator: false,
          freelance: false,
          indie: false,
          ping: false,
          currentActivity: "",
          previousActivity: "",
        },
      },
    });
  }
};
