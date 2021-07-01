import {
  BlockButtonAction,
  BlockCheckboxesAction,
  Middleware,
  SlackActionMiddlewareArgs,
  SlackViewMiddlewareArgs,
} from "@slack/bolt/dist/types";
import {
  ChatDeleteScheduledMessageArguments,
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  ChatScheduledMessagesListArguments,
  ChatScheduledMessagesListResponse,
  ChatScheduleMessageArguments,
  ChatScheduleMessageResponse,
  ConversationsOpenResponse,
} from "@slack/web-api";
import chunk from "lodash/fp/chunk";
import pipe from "lodash/fp/pipe";
import shuffle from "lodash/fp/shuffle";
import {
  AlreadyRemoveAllReminders,
  CoffeeBotReminderComment,
  Day,
  JAYDEN_ID,
  ReminderCount,
  SuccessToRemoveAllReminders,
} from "../constants";
import {
  createNextNReminderDatesByMultipleDays,
  getUnixTimeStamp,
} from "../utils/helpers";
import { createReminderBlocks } from "../blocks";
import { ViewSubmitAction } from "@slack/bolt/dist/types/view";

export const clickCheckBoxes: Middleware<
  SlackActionMiddlewareArgs<BlockCheckboxesAction>
> = async ({ ack, body }) => {
  await ack();
  console.info(body.actions[0].selected_options.map((option) => option.text));
};

export const submitButton: Middleware<
  SlackViewMiddlewareArgs<ViewSubmitAction>
> = async ({ ack, body, client, payload, ...rest }) => {
  await ack();

  // below code very sucks, 😣😣 where state comes from?
  const checkedUserIds: string[] = Object.values(payload.state.values)
    .filter((v) => !!v["click-checkboxes"])
    .flatMap((v) => v["click-checkboxes"]["selected_options"])
    .map((v) => v.value);

  const splitCount = +Object.values(payload.state.values).filter(
    (v) => v["select-split-count"]
  )[0]["select-split-count"].selected_option.value;

  const initMsg = Object.values(payload.state.values).filter(
    (v) => v["plain_text_input_bot_init_comment"]
  )[0]["plain_text_input_bot_init_comment"].value;

  const chunkedParticipants = pipe(
    shuffle,
    chunk(splitCount)
  )(checkedUserIds) as string[][];

  if (chunkedParticipants[chunkedParticipants.length - 1].length < splitCount) {
    const leftUsers = chunkedParticipants.pop();
    leftUsers &&
      leftUsers.forEach((leftUser, i) => {
        chunkedParticipants[i].push(leftUser);
      });
  }

  const conversations = await Promise.allSettled(
    chunkedParticipants.map((participants) => {
      const users = participants.join(",");
      return client.apiCall("conversations.open", {
        users,
        return_im: true,
      }) as Promise<ConversationsOpenResponse>;
    })
  );

  const conversationsText = chunkedParticipants.reduce((a, e, i) => {
    return a + `\n\n${i + 1}번째 그룹: ${e.join(", ")}`;
  }, "");

  await client.apiCall("chat.postMessage", {
    text: "conversations 생성 완료\n\n" + conversationsText,
    channel: JAYDEN_ID,
  } as ChatPostMessageArguments);

  const fulfilledConversations = conversations.filter(
    (
      conversation
    ): conversation is PromiseFulfilledResult<ConversationsOpenResponse> =>
      conversation.status === "fulfilled"
  );

  console.info("fulfilledConversations", fulfilledConversations);

  const postMessagePromises = fulfilledConversations.map((c) => {
    const channelId = c.value.channel?.id;
    if (!channelId)
      throw new Error(`Fail to open channel channelId: ${channelId}`);

    const reminderBlocks = createReminderBlocks(initMsg, channelId);

    return client.apiCall("chat.postMessage", {
      channel: channelId,
      text: " ",
      blocks: reminderBlocks,
    } as ChatPostMessageArguments) as Promise<ChatPostMessageResponse>;
  });

  const scheduleMessagePromises = fulfilledConversations.flatMap((c) => {
    const channelId = c.value.channel?.id;
    if (!channelId)
      throw new Error(`Fail to open channel channelId: ${channelId}`);

    return createNextNReminderDatesByMultipleDays(new Date(), ReminderCount, [
      Day.MONDAY,
      Day.THURSDAY,
    ]).map(
      (date, i) =>
        client.apiCall("chat.scheduleMessage", {
          channel: channelId,
          post_at: getUnixTimeStamp(date).toString(),
          text: " ",
          blocks: createReminderBlocks(
            `${5 - i}번째 Reminder: ${CoffeeBotReminderComment}`,
            channelId
          ),
        } as ChatScheduleMessageArguments) as Promise<ChatScheduleMessageResponse>
    );
  });

  const postMessageRes = await Promise.all(postMessagePromises);
  console.info("postMessageRes", postMessageRes);

  const scheduleMessageRes = await Promise.all(scheduleMessagePromises);
  console.info("scheduleMessageRes", scheduleMessageRes);
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
