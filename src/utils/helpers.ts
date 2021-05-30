import {
  GenericMessageEvent,
  MessageEvent,
  ReactionAddedEvent,
  ReactionMessageItem,
} from "@slack/bolt";

export const isGenericMessageEvent = (
  msg: MessageEvent
): msg is GenericMessageEvent => {
  return (msg as GenericMessageEvent).subtype === undefined;
};

export const isMessageItem = (
  item: ReactionAddedEvent["item"]
): item is ReactionMessageItem => {
  return (item as ReactionMessageItem).type === "message";
};

export const getUnixTimeStamp = (data: Date): number => {
  return Math.floor(data.getTime() / 1000);
};

export const formatDateToStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = ("0" + (d.getMonth() + 1)).slice(-2);
  const date = ("0" + d.getDate()).slice(-2);
  return `${year}-${month}-${date}`;
};

export const createDateNdaysHence = (n: number): Date => {
  const newDate = new Date();
  newDate.setDate(newDate.getDate() + n);
  return newDate;
};
