import { StopReminderButtonLabel } from "../constants";

export function createReminderBlocks(
  botComment: string,
  reminderMsgId: string
) {
  return [
    {
      type: "section",
      text: { type: "plain_text", text: botComment },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: StopReminderButtonLabel,
            emoji: true,
          },
          value: reminderMsgId,
          action_id: "remove-reminder-button",
          style: "danger",
        },
      ],
    },
  ];
}
