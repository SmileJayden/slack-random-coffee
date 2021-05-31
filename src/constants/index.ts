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
  "🐣 🐥 🐣 🐥안녕하세요 여러분. 전 MiniTRIC Bot입니다.\n" +
  "모이신 여러분들이 서로 논의를 해서 이번에는 어떤 액티비티를(원데이클래스 등) 할지 논의 후 P&C에 컨펌을 해주세요\n" +
  "Basic Rule은 다음과 같습니다.\n" +
  "1. 인당 예산은 4만원입니다.\n" +
  "2. 고위험 액티비티(실외 암벽등반, 스카이다이빙, 안전요원없는 수중액티비티 등) 는 불가합니다.\n" +
  "   전사 차원에서 진행하는 행사가 아니긴 하지만, 그래도 여러분이 혹시라도 다칠까봐 넘 걱정이 돼요.\n" +
  "3. 단순 식사/단순 음주가무는 예산지원이 안됩니다.최소 2만원 이상은 액티비티에 사용해 주세요.\n" +
  "4. MiniTRIC 액티비티가 P&C에서 OKAY가 되고 날짜도 확정되면 Docswave를 통해 해당날짜에 본인의 TRIC을 기안해주세요.\n" +
  "편의상 휴가신청서에 Mini TRIC을 넣어서 진행하도록 하겠습니다. 해당 건은 Lead승인을 필요로 하진 않습니다만, P&C리컨펌 + 팀원들이 스케쥴을 알아야 하니 휴가신청서 기안에서 팝업되는 설명에 쓰여 있는 프로세스대로 기안을 진행해 주세요.\n\n" +
  "MiniTRIC 컨텐츠와 시간 약속을 잡으셨나요? 그렇다면 아래의 '네 결정했습니다' 버튼을 눌러주세요 😀😀 ";
export const CoffeeBotReminderComment =
  "여러분 함께 모여 무엇을 할지 생각해 보셨나요?\n 아직 결정하지 못하셨다면 같이 얘기해봅시다~! \n\n If you want to stop reminder, plz click '네 결정했습니다' button below";

export const StopReminderButtonLabel = "네 결정했습니다 (리마인더 끄기)";
export const SuccessToRemoveAllReminders =
  "Success to stop reminder! We hope you have a great MiniTRIC 🥰 🥰";
export const AlreadyRemoveAllReminders =
  "There is no more MiniTRIC reminder 😀 😀";
export const ReminderCount = 5;
export const ReminderDelaySec = 20;
export const ReminderDelayDays = 4;

// exec minitric
export const HeaderMsg = "MiniTRIC";
export const SelectSplitCountExceptionMrkdwn =
  "You should select *Split Number* 😅";
export const CheckBoxSectionMrkdwn =
  "Below is all of *MiniTric* participants 🐣 🐥 ️\nPlz uncheck member to be *excluded*";
export const ExecRandomCoffeeAuthorizedExceptionMrkdwn =
  "Only _*authorized user*_ can use `execminitric` command 😅";
export const CreateRandomDMsAuthorizedExceptionMrkdwn =
  "Only _*authorized user*_ can use *Create MiniTRIC DMs* 😅";
export const CheckUserMoreThanSplitCountExceptionMrkdwn =
  "You should select users more then split count 😅";
export const ConfirmButtonLabel = "Create MiniTRIC DMs";
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
