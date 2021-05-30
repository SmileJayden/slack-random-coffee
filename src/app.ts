import "./utils/env";
import { App, ExpressReceiver, LogLevel } from "@slack/bolt";
import {
  BlockButtonAction,
  BlockCheckboxesAction,
} from "@slack/bolt/dist/types";
import serverlessExpress from "@vendia/serverless-express";
import { execRandomCoffee } from "./messages";
import {
  clickCheckBoxes,
  clickRemoveReminderButton,
  submitButton,
} from "./actions";

const token = process.env.SLACK_BOT_TOKEN;
const signingSecret = process.env.SLACK_SIGNING_SECRET;

if (!signingSecret)
  throw new Error("process.env.SLACK_SIGNING_SECRET should be included");

const expressReceiver = new ExpressReceiver({
  signingSecret,
  // The `processBeforeResponse` option is required for all FaaS environments.
  // It allows Bolt methods (e.g. `app.message`) to handle a Slack request
  // before the Bolt framework responds to the request (e.g. `ack()`). This is
  // important because FaaS immediately terminate handlers after the response.
  processBeforeResponse: true,
});

const app = new App({
  token,
  receiver: expressReceiver,
  logLevel: LogLevel.DEBUG,
});

app.message("exec_random_coffee", execRandomCoffee);

app.action<BlockCheckboxesAction>("click-checkboxes", clickCheckBoxes);

app.action<BlockButtonAction>(
  "remove-reminder-button",
  clickRemoveReminderButton
);

app.action<BlockButtonAction>("submit-button", submitButton);

if (process.env.DEVELOPMENT) {
  (async () => {
    // Start your app
    const port = Number(process.env.PORT) || 3000;
    await app.start(port);
    console.info(`⚡️ Bolt app is running on ${port}!`);
  })();
}

module.exports.handler = serverlessExpress({
  app: expressReceiver.app,
});
