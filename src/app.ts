import bolt from "@slack/bolt";
import "dotenv/config";
import { fetchThreadMessages } from "./services/slack.js";
import { getGeminiSummary, isGeminiErrorResponse } from "./services/gemini.js";

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

  const allMessages = await fetchThreadMessages(client, channel, threadTimestamp);

  if (!allMessages || allMessages.length === 0) {
    console.error("Could not fetch thread messages.");
    return;
  }

  // Remove the last message (the mention itself) and filter out bot messages
  const relevantMessages = allMessages
    .slice(0, -1)
    .filter((msg) => botUserId && msg.user !== botUserId && !msg.text?.includes(botUserId));

  const lastAppMention = allMessages[allMessages.length - 1]?.text?.replace(`<@${botUserId}>`, "").trim() || "";
  console.log("🚀 ~ lastAppMention:", lastAppMention);
  const formattedThreadContext = relevantMessages.map((msg) => `${msg.user}: ${msg.text}`).join("\n");
  console.log("🚀 ~ formattedThreadContext:", formattedThreadContext);

  // Send acknowledgment message short lived
  if (userId) {
    await client.chat.postEphemeral({
      channel,
      text: `:thinking_face: Processing your request...`,
      user: userId,
      thread_ts: threadTimestamp,
    });
  }

  // Get AI summary
  const aiSummary = await getGeminiSummary(formattedThreadContext, lastAppMention);
  console.log("🚀 ~ aiSummary:", aiSummary);

  if (!aiSummary || isGeminiErrorResponse(aiSummary)) {
    const errorMessage = aiSummary?.error || "An error occurred while processing your request.";
    await client.chat.postMessage({
      channel,
      text: `:warning: ${errorMessage}`,
      thread_ts: threadTimestamp,
    });
    return;
  }
});

// --- Start the App ---
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();
