import {
  BlockButtonAction,
  BlockCheckboxesAction,
  Middleware,
  SlackActionMiddlewareArgs,
} from "@slack/bolt/dist/types";
import { ConversationsOpenResponse } from "@slack/web-api";
import chunk from "lodash/fp/chunk";
import { CoffeeBotInitialComment, RANDOM_COFFEE_USER_ID } from "../constants";

export const clickCheckBoxes: Middleware<
  SlackActionMiddlewareArgs<BlockCheckboxesAction>
> = async ({ ack, body }) => {
  await ack();
  console.log(body.actions[0].selected_options.map((option) => option.text));
};

export const submitButton: Middleware<
  SlackActionMiddlewareArgs<BlockButtonAction>
> = async ({ ack, body, client }) => {
  await ack();

  // below code very sucks, 😣😣 where state comes from?
  const checkedUserIds = Object.values(
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
  )[0]["select-split-count"]["selected_option"].value;

  const chunkedParticipants = chunk(splitCount)(checkedUserIds);

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

    const respPostMsg = await client.apiCall("chat.postMessage", {
      channel: conversation.channel.id,
      text: CoffeeBotInitialComment,
    });
  }
};
