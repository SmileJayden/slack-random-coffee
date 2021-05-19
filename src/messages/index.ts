import { Middleware, SlackEventMiddlewareArgs } from "@slack/bolt/dist/types";
import {
  ConversationsMembersArguments,
  ConversationsMembersResponse,
  UsersInfoResponse,
} from "@slack/web-api";
import chunk from "lodash/fp/chunk";
import {
  CheckBoxSectionMrkdwn,
  ConfirmButtonLabel,
  HeaderMsg,
  RANDOM_COFFEE_USER_ID,
  RandomCoffeeDefaultCount,
  RandomCoffeeMaxCount,
  SlackBlockMax,
  TEST_JD_RANDOM_COFFEE,
} from "../constants";

export const execRandomCoffee: Middleware<SlackEventMiddlewareArgs<"message">> =
  async ({ say, client }) => {
    const conversationsMembersResponse: ConversationsMembersResponse =
      // plz give me generic 🥲
      await client.apiCall("conversations.members", {
        channel: TEST_JD_RANDOM_COFFEE,
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
          options: Array(Math.min(processedUsers.length, RandomCoffeeMaxCount))
            .fill(null)
            .map((_, i) => ({
              text: {
                type: "plain_text",
                text: `${i + 1}`,
                emoji: true,
              },
              value: `${i + 1}`,
            })),
          action_id: "select-split-count",
          initial_option: {
            text: {
              type: "plain_text",
              text: `${RandomCoffeeDefaultCount}`,
              emoji: true,
            },
            value: `${RandomCoffeeDefaultCount}`,
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
