export const RANDOM_COFFEE_CHANNEL_ID_DEV = "C022E917HNV";
export const RANDOM_COFFEE_CHANNEL_ID_PRODUCTION = "C023BQVNNDP";
export const GENERAL_CHANNEL_ID = "C3R96HYEB";
export const JAYDEN_ID = "ULE7CE3UM";
export const JOY_ID = "UD40K1ZV2";
export const ANDER_ID = "U0138GWQSCV";
export const RANDOM_COFFEE_BOT_ID = "U021LSL0EBZ";
export const MINITRIC_BOT_ID = "U023WFT345P";
export const AuthorizedUsers = [ANDER_ID, JAYDEN_ID];
export const SlackBlockMax = 10;
export const RandomCoffeeMinCount = 2;
export const RandomCoffeeMaxCount = 4;
export const RandomCoffeeDefaultCount = 4;

// reminder
export const CoffeeBotInitialComment =
  "Let's have some coffee ☕️ ☕\n\n If you want to stop reminder, plz click 'Stop Reminder' button below";
export const CoffeeBotReminderComment =
  "업무가 바쁘셔서 커피 타임을 아직 가지시지 못하셨나요? 🥲 🥲\n 그래도 동료들과 커피 한잔 하면서 잠깐 쉬어가시는 건 어떨까요? ☕️ ☕ \n\n If you want to stop reminder, plz click 'Stop Reminder' button below";
export const StopReminderButtonLabel = "Stop Reminder";
export const SuccessToRemoveAllReminders =
  "Success to stop reminder! We hope you had a great time 🥰 🥰";
export const AlreadyRemoveAllReminders = "You already stopped reminder 😀 😀";
export const ReminderCount = 5;
export const ReminderDelaySec = 20;
export const ReminderDelayDays = 4;

// exec random coffee
export const HeaderMsg = "Random Coffee";
export const SelectSplitCountExceptionMrkdwn =
  "You should select *Split Number* 😅";
export const CheckBoxSectionMrkdwn =
  "Below is all of *RandomCoffee* participants ☕️ ☕ ️\nPlz uncheck member to be *excluded*";
export const ExecRandomCoffeeAuthorizedExceptionMrkdwn =
  "Only _*authorized user*_ can use `exec_random_coffee` command 😅";
export const CreateRandomDMsAuthorizedExceptionMrkdwn =
  "Only _*authorized user*_ can use *Create Random Coffee DMs* 😅";
export const CheckUserMoreThanSplitCountExceptionMrkdwn =
  "You should select users more then split count 😅";
export const ConfirmButtonLabel = "Create Random Coffee DMs";
export const CoffeeDueDays = 14;

// utils
export enum Day {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
}
