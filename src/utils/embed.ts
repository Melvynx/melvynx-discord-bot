import { ButtonBuilder, ButtonStyle } from "discord.js";

export const startQuizButton = (kicked: boolean): ButtonBuilder => {
  return new ButtonBuilder()
    .setCustomId(kicked ? "start_quiz_kicked" : "start_quiz")
    .setLabel(kicked ? "Recommencer" : "Commencer le mini-quiz")
    .setStyle(ButtonStyle.Primary)
    .setEmoji({
      id: "1142470407186808943",
      name: "casquettebot"
    })
    .setDisabled(kicked);
};