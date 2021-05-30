import {
  BlockButtonAction,
  BlockCheckboxesAction,
  Middleware,
  SlackActionMiddlewareArgs,
} from "@slack/bolt/dist/types";
import {
  ChatDeleteScheduledMessageArguments,
  ChatDeleteScheduledMessageResponse,
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  ChatScheduleMessageResponse,
  ConversationsOpenResponse,
} from "@slack/web-api";
import chunk from "lodash/fp/chunk";
import {
  AuthorizedUsers,
  CheckUserMoreThanSplitCountExceptionMrkdwn,
  CoffeeBotInitialComment,
  CreateRandomDMsAuthorizedExceptionMrkdwn,
  RANDOM_COFFEE_USER_ID,
  SelectSplitCountExceptionMrkdwn,
} from "../constants";
import { getUnixTimeStamp } from "../utils/helpers";
import { createReminderBlocks } from "../blocks";

export const clickCheckBoxes: Middleware<
  SlackActionMiddlewareArgs<BlockCheckboxesAction>
> = async ({ ack, body }) => {
  await ack();
  console.log(body.actions[0].selected_options.map((option) => option.text));
};

export const submitButton: Middleware<
  SlackActionMiddlewareArgs<BlockButtonAction>
> = async ({ ack, body, client, payload, say, ...rest }) => {
  await ack();

  if (!AuthorizedUsers.includes(body.user.id)) {
    await say({
      mrkdwn: true,
      text: CreateRandomDMsAuthorizedExceptionMrkdwn,
    });
    return;
  }

  // below code very sucks, 😣😣 where state comes from?
  const checkedUserIds: string[] = Object.values(
    // @ts-ignore
    body.state.values
  )
    // @ts-ignore
    .filter((v) => v["click-checkboxes"])
    // @ts-ignore
    .flatMap((v) => v["click-checkboxes"]["selected_options"])
    .map((v) => v.value);

  // @ts-ignore
  const splitCount = +Object.values(body.state.values).filter(
    // @ts-ignore
    (v) => v["select-split-count"]
  )[0]["select-split-count"]["selected_option"]?.value;

  if (isNaN(splitCount)) {
    await say({
      text: SelectSplitCountExceptionMrkdwn,
      mrkdwn: true,
    });
    return;
  }

  if (splitCount > checkedUserIds.length) {
    await say({
      text: CheckUserMoreThanSplitCountExceptionMrkdwn,
      mrkdwn: true,
    });
    return;
  }

  const chunkedParticipants = chunk(splitCount)(checkedUserIds);

  if (chunkedParticipants[chunkedParticipants.length - 1].length < splitCount) {
    const leftUsers = chunkedParticipants.pop();
    leftUsers &&
      leftUsers.forEach((leftUser, i) => {
        chunkedParticipants[i].push(leftUser);
      });
  }

  for (const chuck of chunkedParticipants) {
    const users = chuck.join(",") + `,${RANDOM_COFFEE_USER_ID}`;

    const conversation: ConversationsOpenResponse = await client.apiCall(
      "conversations.open",
      {
        users,
        return_im: true,
      }
    );

    if (!conversation.channel)
      throw new Error(`fail to open channel users: ${users}`);

    // add scheduled reminder message, stop block reminder
    const {
      channel: scheduledMessageChannel,
      scheduled_message_id: scheduledMessageId,
    }: ChatScheduleMessageResponse = await client.apiCall(
      "chat.scheduleMessage",
      {
        channel: conversation.channel,
        post_at: getUnixTimeStamp(new Date(10000)),
        text: "exec_coffee_reminder",
      }
    );

    if (scheduledMessageId === undefined)
      throw new Error("Fail to scheduleMessage message");

    const reminderBlocks = createReminderBlocks(
      CoffeeBotInitialComment,
      scheduledMessageId
    );

    const { channel: groupChannelId }: ChatPostMessageResponse =
      await client.apiCall("chat.postMessage", {
        channel: conversation.channel.id,
        blocks: reminderBlocks,
      });
  }
};

export const clickRemoveReminderButton: Middleware<
  SlackActionMiddlewareArgs<BlockButtonAction>
> = async ({ ack, body, payload, client, ...rest }) => {
  await ack();

  console.log("body", body.channel);
  console.log("rest", rest);

  const removeReminderChannelId = body.channel?.id;
  const removeReminderScheduledMsgId = body.actions; // TODO(how I get value?)

  const deleteScheduledMessageResp: ChatDeleteScheduledMessageResponse =
    await client.apiCall("chat.deleteScheduledMessage", {
      channel: removeReminderChannelId,
      scheduled_message_id: removeReminderChannelId,
    } as ChatDeleteScheduledMessageArguments);

  const postMessageResp: ChatPostMessageResponse = await client.apiCall(
    "chat.postMessage",
    {
      channel: removeReminderChannelId,
      text: "Success to stop reminder! We hope you had a great time 🥰 🥰",
    } as ChatPostMessageArguments
  );
};
