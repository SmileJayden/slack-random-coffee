import "./utils/env";
import { App, LogLevel } from "@slack/bolt";
import {
  BlockButtonAction,
  BlockCheckboxesAction,
} from "@slack/bolt/dist/types";
import { execRandomCoffee } from "./messages";
import { clickCheckBoxes, submitButton } from "./actions";

const token = process.env.SLACK_BOT_TOKEN;
const signingSecret = process.env.SLACK_SIGNING_SECRET;

const app = new App({
  token,
  signingSecret,
  logLevel: LogLevel.DEBUG,
});

app.message("exec_random_coffee", execRandomCoffee);

app.action<BlockCheckboxesAction>("click-checkboxes", clickCheckBoxes);

app.action<BlockButtonAction>("submit-button", submitButton);

(async () => {
  // Start your app
  const port = Number(process.env.PORT) || 3000;
  await app.start(port);
  console.info(`⚡️ Bolt app is running on ${port}!`);
})();
