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

export const states: Map<string, UserQuestionState> = new Map();

export const resetUserState = (userId: string) => {
  console.trace(`Reset user state: ${userId}`);
  states.set(userId, { state: 1, info: {} });
}

export const setUserKickDate = (userId: string) => {
  console.log("setUserKickDate", userId);
  const userState = states.get(userId);

  if (!userState) return;

  userState.kickDate = new Date();
  userState.info.isWarned = false;
  states.set(userId, userState);
}

export const getUserState = (userId: string): UserQuestionState | undefined => {
  return states.get(userId);
}

export const setUserState = (userId: string, state: UserQuestionState) => {
  states.set(userId, state);
}

export const deleteUserState = (userId: string) => {
  states.delete(userId);
}

export const existsUserState = (userId: string): boolean => {
  return states.has(userId);
}