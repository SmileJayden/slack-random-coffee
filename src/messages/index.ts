import { Middleware, SlackEventMiddlewareArgs } from "@slack/bolt/dist/types";
import {
  ChatPostMessageResponse,
  ChatScheduleMessageResponse,
  ConversationsMembersArguments,
  ConversationsMembersResponse,
  UsersInfoResponse,
} from "@slack/web-api";
import chunk from "lodash/fp/chunk";
import {
  AuthorizedUsers,
  CheckBoxSectionMrkdwn,
  CoffeeBotReminderComment,
  ConfirmButtonLabel,
  ExecRandomCoffeeAuthorizedExceptionMrkdwn,
  HeaderMsg,
  RANDOM_COFFEE_CHANNEL_ID_DEV,
  RANDOM_COFFEE_CHANNEL_ID_PRODUCTION,
  RANDOM_COFFEE_USER_ID,
  RandomCoffeeDefaultCount,
  RandomCoffeeMaxCount,
  RandomCoffeeMinCount,
  SlackBlockMax,
} from "../constants";
import { getUnixTimeStamp } from "../utils/helpers";
import { createReminderBlocks } from "../blocks";

export const execCoffeeReminder: Middleware<
  SlackEventMiddlewareArgs<"message">
> = async ({ say, client, payload }) => {
  const channelId = payload; // TODO: getChannelId

  // add scheduled reminder message, stop block reminder
  const {
    channel: scheduledMessageChannel,
    scheduled_message_id: scheduledMessageId,
  }: ChatScheduleMessageResponse = await client.apiCall(
    "chat.scheduleMessage",
    {
      channel: channelId,
      post_at: getUnixTimeStamp(new Date(10000)),
      text: "exec_coffee_reminder",
    }
  );

  if (scheduledMessageId === undefined)
    throw new Error("Fail to scheduleMessage message");

  const reminderBlocks = createReminderBlocks(
    CoffeeBotReminderComment,
    scheduledMessageId
  );

  const { channel: groupChannelId }: ChatPostMessageResponse =
    await client.apiCall("chat.postMessage", {
      channel: channelId,
      blocks: reminderBlocks,
    });
};

export const execRandomCoffee: Middleware<SlackEventMiddlewareArgs<"message">> =
  async ({ say, client, payload }) => {
    // @ts-ignore
    if (!AuthorizedUsers.includes(payload.user)) {
      await say({
        mrkdwn: true,
        text: ExecRandomCoffeeAuthorizedExceptionMrkdwn,
      });
      return;
    }

    const conversationsMembersResponse: ConversationsMembersResponse =
      // plz give me generic 🥲
      await client.apiCall("conversations.members", {
        channel: process.env.DEVELOPMENT
          ? RANDOM_COFFEE_CHANNEL_ID_DEV
          : RANDOM_COFFEE_CHANNEL_ID_PRODUCTION,
      } as ConversationsMembersArguments);

    if (!conversationsMembersResponse.members) throw new Error("No Members");

    const allUsers = await Promise.all(
      conversationsMembersResponse.members.map(
        (memberId) =>
          client.apiCall("users.info", {
            user: memberId,
          }) as Promise<UsersInfoResponse> // plz give me generic 🥲
      )
    );

    const processedUsers = allUsers
      .filter((user) => user.user?.id !== RANDOM_COFFEE_USER_ID)
      .map((user) => ({
        userDisplayName:
          user.user?.profile?.display_name_normalized ||
          user.user?.profile?.real_name_normalized,
        ...user.user,
      }))
      .sort((x, y) => {
        if (!x.userDisplayName || !y.userDisplayName)
          throw new Error("userDisplayName should not be undefined");
        return x.userDisplayName.localeCompare(y.userDisplayName);
      });

    if (processedUsers.length <= RandomCoffeeMinCount) {
      await say({
        text: `Random Coffee member count should be more than ${RandomCoffeeMinCount}`,
        mrkdwn: true,
      });
      return;
    }

    // TODO(jayden) add due date picker
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: HeaderMsg,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: CheckBoxSectionMrkdwn,
        },
      },
      ...chunk(SlackBlockMax)(processedUsers).map((chunkedUsers) => ({
        type: "input",
        element: {
          type: "checkboxes",
          options: chunkedUsers.map((user) => ({
            text: {
              type: "plain_text",
              text: user.userDisplayName,
              emoji: true,
            },
            value: user.id,
          })),
          initial_options: chunkedUsers.map((user) => ({
            text: {
              type: "plain_text",
              text: user.userDisplayName,
              emoji: true,
            },
            value: user.id,
          })),
          action_id: "click-checkboxes",
        },
        label: {
          type: "plain_text",
          text: " ",
          emoji: true,
        },
      })),
      {
        type: "input",
        element: {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: "split by",
            emoji: true,
          },
          options: Array(
            Math.max(
              RandomCoffeeMinCount,
              Math.min(processedUsers.length, RandomCoffeeMaxCount)
            )
          )
            .slice(1)
            .fill(null)
            .map((_, i) => ({
              text: {
                type: "plain_text",
                text: `${i + 2}`,
                emoji: true,
              },
              value: `${i + 2}`,
            })),
          action_id: "select-split-count",
          initial_option: {
            text: {
              type: "plain_text",
              text: `${Math.min(
                RandomCoffeeDefaultCount,
                processedUsers.length
              )}`,
              emoji: true,
            },
            value: `${Math.min(
              RandomCoffeeDefaultCount,
              processedUsers.length
            )}`,
          },
        },
        label: {
          type: "plain_text",
          text: "Split Number",
          emoji: true,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: ConfirmButtonLabel,
              emoji: true,
            },
            value: "some_value",
            action_id: "submit-button",
            style: "primary",
          },
        ],
      },
    ];

    await say({
      blocks,
    });
  };
