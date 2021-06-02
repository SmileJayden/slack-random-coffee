import {
  Middleware,
  SlackCommandMiddlewareArgs,
  SlackEventMiddlewareArgs,
} from "@slack/bolt/dist/types";
import {
  ChatPostMessageResponse,
  ChatScheduleMessageResponse,
  ConversationsMembersArguments,
  ConversationsMembersResponse,
  UsersInfoResponse,
  ViewsOpenArguments,
} from "@slack/web-api";
import chunk from "lodash/fp/chunk";
import {
  AuthorizedUsers,
  CheckBoxSectionMrkdwn,
  CoffeeBotReminderComment,
  CoffeeDueDays,
  ConfirmButtonLabel,
  ExecRandomCoffeeAuthorizedExceptionMrkdwn,
  HeaderMsg,
  RANDOM_COFFEE_CHANNEL_ID_DEV,
  RANDOM_COFFEE_CHANNEL_ID_PRODUCTION,
  RANDOM_COFFEE_BOT_ID,
  RandomCoffeeDefaultCount,
  RandomCoffeeMaxCount,
  RandomCoffeeMinCount,
  SlackBlockMax,
  MINITRIC_BOT_ID,
  CoffeeBotInitialComment,
} from "../constants";

export const execRandomCoffee: Middleware<SlackCommandMiddlewareArgs> = async ({
  ack,
  say,
  client,
  payload,
  body,
}) => {
  await ack();
  // @ts-ignore
  if (!AuthorizedUsers.includes(payload.user_id)) {
    await say({
      mrkdwn: true,
      text: ExecRandomCoffeeAuthorizedExceptionMrkdwn,
    });
    return;
  }

  const conversationsMembersResponse: ConversationsMembersResponse =
    // plz give me generic 🥲
    await client.apiCall("conversations.members", {
      channel: payload.channel_id,
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
    .filter(
      (user) =>
        user.user?.id &&
        ![MINITRIC_BOT_ID, RANDOM_COFFEE_BOT_ID].includes(user.user?.id)
    )
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
      type: "section",
      text: {
        type: "mrkdwn",
        text: CheckBoxSectionMrkdwn,
      },
    },
    ...chunk(SlackBlockMax)(processedUsers).map((chunkedUsers) => ({
      type: "input",
      optional: true,
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
          value: `${Math.min(RandomCoffeeDefaultCount, processedUsers.length)}`,
        },
      },

      label: {
        type: "plain_text",
        text: "Split Number",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        multiline: true,
        action_id: "plain_text_input_bot_init_comment",
        initial_value: CoffeeBotInitialComment,
      },
      label: {
        type: "plain_text",
        text: "공지 메세지",
        emoji: true,
      },
    },
  ];

  try {
    const result = await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "create_dms_view",
        title: {
          type: "plain_text",
          text: HeaderMsg,
        },
        blocks,
        submit: {
          type: "plain_text",
          text: "Submit",
        },
      },
    } as ViewsOpenArguments);
    console.info(result);
  } catch (e) {
    console.error(e);
  }
};
