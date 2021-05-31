import {
  GenericMessageEvent,
  MessageEvent,
  ReactionAddedEvent,
  ReactionMessageItem,
} from "@slack/bolt";
import { View as HomeView } from "@slack/types/dist";
import { welcomeBlocks } from "../blocks";

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

export const createDateNSecondsHence = (n: number): Date => {
  const newDate = new Date();
  newDate.setSeconds(newDate.getSeconds() + n);
  return newDate;
};

export const createDateNdaysHence = (n: number): Date => {
  const newDate = new Date();
  newDate.setDate(newDate.getDate() + n);
  return newDate;
};

export const getNextDayOfWeek = (date: Date, dayOfWeek: number): Date => {
  const resultDate = new Date(date.getTime());
  resultDate.setDate(
    date.getDate() + ((7 + dayOfWeek - date.getDay() - 1) % 7) + 1
  );
  return resultDate;
};

export const getNextDayOfWeekByMultipleDays = (
  date: Date,
  dayOfWeek: number[]
): Date => {
  const resultDates: Date[] = [];
  for (const day of dayOfWeek) {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(
      date.getDate() + ((7 + day - date.getDay() - 1) % 7) + 1
    );
    resultDates.push(resultDate);
  }

  return resultDates.reduce(function (prev, curr) {
    return prev > curr ? prev : curr;
  });
};

export const createNextNReminderDatesByMultipleDays = (
  date: Date,
  n: number,
  days: number[]
): Date[] => {
  if (n === 0) return [];
  else if (n === 1) {
    const nextDay = getNextDayOfWeekByMultipleDays(date, days);
    return [nextDay];
  } else {
    const resultDates = createNextNReminderDatesByMultipleDays(
      date,
      n - 1,
      days
    );
    const nextDay = getNextDayOfWeekByMultipleDays(resultDates[0], days);
    return [nextDay, ...resultDates];
  }
};

export const getHomeView = (): HomeView => ({
  type: "home",
  title: {
    type: "plain_text",
    text: "Welcome MiniTricApp!",
  },
  blocks: welcomeBlocks(),
});
