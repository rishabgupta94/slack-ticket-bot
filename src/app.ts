import bolt from "@slack/bolt";
import "dotenv/config";
import { fetchThreadMessages, handleSlackPost } from "./services/slack.js";
import { getGeminiSummary, isGeminiErrorResponse } from "./services/gemini.js";
import { createJiraTicket } from "./services/jira.js";

const { App } = bolt;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN || "",
  signingSecret: process.env.SLACK_SIGNING_SECRET || "",
});

// --- Event Listener ---
// Bolt makes listening for events much cleaner and fully typed!
app.event("app_mention", async ({ event, client, context }) => {
  console.log("✅ App mention detected by Bolt!");

  const botUserId = context.botUserId;
  const { channel, thread_ts, ts, text: userCommand, user: userId } = event;
  const threadTimestamp = thread_ts || ts;

  if (!userId) {
    console.error("User ID is missing from the event.");
    return;
  }

  // Send short lived acknowledgment message
  await handleSlackPost(
    client.chat.postEphemeral({
      channel,
      text: `:thinking_face: Processing your request...`,
      user: userId,
      thread_ts: threadTimestamp,
    })
  );

  const slackThreadContext = await fetchThreadMessages(client, channel, threadTimestamp, botUserId);

  if (!slackThreadContext) {
    await handleSlackPost(
      client.chat.postEphemeral({
        channel,
        text: `:warning: Couldn't fetch the thread messages. Please ensure the thread has messages and try again.`,
        user: userId,
        thread_ts: threadTimestamp,
      })
    );
    return;
  }

  const { formattedThreadContext, appMentionUserDirective } = slackThreadContext;

  // ---------- GEMINI ----------
  const aiSummary = await getGeminiSummary(formattedThreadContext, appMentionUserDirective);
  console.log("🚀 ~ aiSummary:", aiSummary);

  // Gemini returned an error response
  if (!aiSummary || isGeminiErrorResponse(aiSummary)) {
    const errorMessage = aiSummary?.error || "An error occurred while processing Gemini's request.";
    await handleSlackPost(
      client.chat.postMessage({
        channel,
        text: `:warning: ${errorMessage}`,
        thread_ts: threadTimestamp,
      })
    );
    return;
  }

  const { title, description } = aiSummary;

  // ---------- JIRA ----------
  const jiraTicket = await createJiraTicket(title, description);
  console.log("🚀 ~ jiraTicket:", jiraTicket);

  if (jiraTicket) {
    // Success! Send a confirmation message with a link.
    await handleSlackPost(
      client.chat.postMessage({
        channel,
        thread_ts: threadTimestamp,
        text: `✅ I've created a ticket for you: <${jiraTicket.url}|${jiraTicket.key}>`,
      })
    );
  } else {
    // Failure at the Jira step
    await handleSlackPost(
      client.chat.postMessage({
        channel,
        thread_ts: threadTimestamp,
        text: `:warning: Something went wrong while creating the JIRA ticket. Please try again.`,
      })
    );
  }
});

// --- Start the App ---
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();
