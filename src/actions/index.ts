import {
  BlockButtonAction,
  BlockCheckboxesAction,
  Middleware,
  SlackActionMiddlewareArgs,
} from "@slack/bolt/dist/types";
import {
  ChatDeleteScheduledMessageArguments,
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  ChatScheduledMessagesListArguments,
  ChatScheduledMessagesListResponse,
  ConversationsOpenResponse,
} from "@slack/web-api";
import chunk from "lodash/fp/chunk";
import {
  AlreadyRemoveAllReminders,
  AuthorizedUsers,
  CheckUserMoreThanSplitCountExceptionMrkdwn,
  CoffeeBotInitialComment,
  CoffeeBotReminderComment,
  CreateRandomDMsAuthorizedExceptionMrkdwn,
  Day,
  RANDOM_COFFEE_USER_ID,
  ReminderCount,
  ReminderDelayDays,
  ReminderDelaySec,
  SelectSplitCountExceptionMrkdwn,
  SuccessToRemoveAllReminders,
} from "../constants";
import {
  createNextNReminderDatesByMultipleDays,
  getUnixTimeStamp,
} from "../utils/helpers";
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

    if (!conversation.channel?.id)
      throw new Error(`Fail to open channel users: ${users}`);

    const channelId = conversation.channel.id;

    await Promise.all(
      createNextNReminderDatesByMultipleDays(new Date(), ReminderCount, [
        Day.MONDAY,
        Day.THURSDAY,
      ]).map((date, i) =>
        client.apiCall("chat.scheduleMessage", {
          channel: channelId,
          post_at: getUnixTimeStamp(date),
          text: " ",
          blocks: createReminderBlocks(
            `${i}번째 Reminder: ${CoffeeBotReminderComment}`,
            channelId
          ),
        })
      )
    );

    // TODO datepicker에서 due date block에 추가하기
    const reminderBlocks = createReminderBlocks(
      CoffeeBotInitialComment,
      conversation.channel.id
    );

    const { channel: groupChannelId }: ChatPostMessageResponse =
      await client.apiCall("chat.postMessage", {
        channel: conversation.channel.id,
        text: " ",
        blocks: reminderBlocks,
      });
  }
};

export const clickRemoveReminderButton: Middleware<
  SlackActionMiddlewareArgs<BlockButtonAction>
> = async ({ ack, body, client, payload }) => {
  await ack();

  const removeReminderChannelId = payload.value;

  const chatScheduledMessagesListResponse: ChatScheduledMessagesListResponse =
    await client.apiCall("chat.scheduledMessages.list", {
      channel: removeReminderChannelId,
    } as ChatScheduledMessagesListArguments);

  if (!chatScheduledMessagesListResponse.scheduled_messages)
    throw new Error("Fail to load scheduledMessages");

  if (chatScheduledMessagesListResponse.scheduled_messages?.length < 1) {
    const postMessageResp: ChatPostMessageResponse = await client.apiCall(
      "chat.postMessage",
      {
        channel: removeReminderChannelId,
        text: AlreadyRemoveAllReminders,
      } as ChatPostMessageArguments
    );
    return;
  }

  await Promise.all(
    chatScheduledMessagesListResponse.scheduled_messages.map(
      (scheduledMessage) =>
        client.apiCall("chat.deleteScheduledMessage", {
          channel: removeReminderChannelId,
          scheduled_message_id: scheduledMessage.id,
        } as ChatDeleteScheduledMessageArguments)
    )
  );

  const postMessageResp: ChatPostMessageResponse = await client.apiCall(
    "chat.postMessage",
    {
      channel: removeReminderChannelId,
      text: SuccessToRemoveAllReminders,
    } as ChatPostMessageArguments
  );
};
