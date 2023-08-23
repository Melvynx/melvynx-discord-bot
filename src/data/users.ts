import "dotenv/config";

import { Client, GuildMember } from "discord.js";
import { readFileSync } from "fs";
import dayjs from "dayjs";

type STATES =
  | "MELVYNX_LOVE_STACK"
  | "CODE"
  | "BEFORE"
  | "AFTER"
  | "FREELANCE"
  | "INDIE"
  | "CREATOR"
  | "MELVYNX_NEED_YOU"
  | "USER_NAME"
  | "DONE";
export const idByStates: Record<STATES, number> = {
  MELVYNX_LOVE_STACK: 1,
  CODE: 2,
  BEFORE: 3,
  AFTER: 4,
  FREELANCE: 5,
  INDIE: 6,
  CREATOR: 7,
  MELVYNX_NEED_YOU: 8,
  USER_NAME: 9,
  DONE: 10,
};

type UserData = {
  userId: string;
  channelId: string;
  quizStarted: boolean;
  recentlyKick?: number;
  canRestart?: number;
  data: {
    state: STATES;
    info: {
      currentActivity: string;
      previousActivity: string;
      freelance: boolean;
      indie: boolean;
      creator: boolean;
      ping: boolean;
    };
  };
};

const freelanceRole = process.env.FREELANCE_ROLE_ID ?? "";
const indieRole = process.env.INDIE_ROLE_ID ?? "";
const creatorRole = process.env.CREATOR_ROLE_ID ?? "";
const melvynxPing = process.env.MELVYNX_PING_ID ?? "";

export const users = new Map();

export const getUser = (userId: string) => {
  return users.get(userId) as UserData | undefined;
};

export const isRecentlyKicked = (userId: string) => {
  const user = getUser(userId);
  if (!user) return false;

  if (user.recentlyKick && user.canRestart) {
    if (dayjs().unix() > user.canRestart) {
      user.recentlyKick = undefined;
      user.canRestart = undefined;
      return false;
    }

    return true;
  }

  return false;
};

export const resetUser = (userId: string) => {
  const user = getUser(userId);
  if (!user) return;

  user.channelId = "";
  user.quizStarted = false;
  user.data = {
    state: "MELVYNX_LOVE_STACK",
    info: {
      creator: false,
      freelance: false,
      indie: false,
      ping: false,
      currentActivity: "",
      previousActivity: "",
    },
  };
};

export const setRecentlyKicked = async (
  userId: string,
  member: GuildMember
) => {
  const user = getUser(userId);
  if (!user) return;

  user.recentlyKick = dayjs().unix();
  user.canRestart = dayjs()
    .add(parseInt(process.env.TIME_TO_WAIT_AFTER_KICK ?? "5"), "minute")
    .unix();

  await member
    .send({
      content: `🎅 J'ai une triste nouvelle pour toi, tu n'aura pas de cadeaux cette année car tu n'a pas bien répondu au quiz. Tu peux recommencer dans ${
        process.env.TIME_TO_WAIT_AFTER_KICK ?? "5"
      } minutes pour essayer de remédier à ce problème.`,
      components: [],
    })
    .catch(() => console.log("Member has DMs disabled"));

  member.kick();

  const channel = member.guild.channels.cache.get(user.channelId);
  if (!channel) return;

  channel.delete();
  resetUser(userId);

  setTimeout(() => {
    user.recentlyKick = undefined;
  }, 300000);
};

export const deleteUser = (userId: string) => {
  const user = getUser(userId);
  if (!user) return;

  users.delete(userId);
};

export const getState = (userId: string): UserData["data"]["state"] => {
  const user = getUser(userId);
  if (!user) return "MELVYNX_LOVE_STACK";

  return user.data.state;
};

export const upState = (userId: string) => {
  const user = getUser(userId);
  if (!user) return;

  const states: STATES[] = [
    "MELVYNX_LOVE_STACK",
    "CODE",
    "BEFORE",
    "AFTER",
    "FREELANCE",
    "INDIE",
    "CREATOR",
    "MELVYNX_NEED_YOU",
    "USER_NAME",
    "DONE",
  ];
  const index = states.indexOf(user.data.state);
  if (index === -1) return;

  user.data.state = states[index + 1];
};

export const startQuiz = (userId: string) => {
  const user = getUser(userId);
  if (!user) return;

  user.quizStarted = true;
};

export const endQuiz = (userId: string) => {
  const user = getUser(userId);
  if (!user) return;

  deleteUser(userId);
};

export const getMessageState = (userId: string): string => {
  const user = getUser(userId);
  if (!user) return "";

  return readFileSync(
    `./resources/questions/${idByStates[user.data.state]}.txt`,
    "utf-8"
  );
};

export const saveResponse = (
  userId: string,
  response: string,
  client: Client
): UserData["data"]["state"] | "ERROR" => {
  const user = getUser(userId);
  if (!user) return "ERROR";

  const giveRole = response.toLowerCase() === "oui";

  const state = user.data.state;
  if (
    state === "FREELANCE" ||
    state === "INDIE" ||
    state === "CREATOR" ||
    state === "MELVYNX_NEED_YOU"
  ) {
    switch (state) {
      case "FREELANCE":
        user.data.info.freelance = giveRole;
        break;
      case "INDIE":
        user.data.info.indie = giveRole;
        break;
      case "CREATOR":
        user.data.info.creator = giveRole;
        break;
      case "MELVYNX_NEED_YOU":
        user.data.info.ping = giveRole;
        break;
    }

    const member = client.guilds.cache
      .get(process.env.GUILD_ID ?? "")
      ?.members.cache.get(userId);
    if (!member) return "ERROR";

    if (
      state === "FREELANCE" &&
      !member.roles.cache.has(freelanceRole) &&
      giveRole
    )
      member.roles.add(freelanceRole);
    if (state === "INDIE" && !member.roles.cache.has(indieRole) && giveRole)
      member.roles.add(indieRole);
    if (state === "CREATOR" && !member.roles.cache.has(creatorRole) && giveRole)
      member.roles.add(creatorRole);
    if (
      state === "MELVYNX_NEED_YOU" &&
      !member.roles.cache.has(melvynxPing) &&
      giveRole
    )
      member.roles.add(melvynxPing);
  }

  if (state === "BEFORE") user.data.info.previousActivity = response;
  if (state === "AFTER") user.data.info.currentActivity = response;

  if (state === "USER_NAME" && response !== "X") {
    const member = client.guilds.cache
      .get(process.env.GUILD_ID ?? "")
      ?.members.cache.get(userId);
    if (member) {
      member.setNickname(response.slice(0, 32));
    }
  }

  users.set(userId, user);

  upState(userId);
  return getState(userId);
};
