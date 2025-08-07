import formbody from "@fastify/formbody";
import "dotenv/config";
import fastify from "fastify";
import { fetchThreadMessages } from "./services/slack.js";
import type { SlackRequestBody } from "./types.js";

const server = fastify();
const PORT = 3000;
let BOT_USER_ID: string | undefined;

server.register(formbody);

server.post("/slack/events", async (request, reply) => {
  // FIXME - add typecheck to make sure the type matches
  const body = request.body as SlackRequestBody;

  console.log("Received data:", body);

  const { channel: channelId, thread_ts, ts, text: userCommand } = body.event;

  // return reply.status(200).send({ challenge: body.challenge });

  if (body.type === "event_callback" && body.event.type === "app_mention") {
    const event = body.event;
    console.log("✅ App mention detected!");

    // Acknowledge the event immediately
    reply.status(200).send();

    // The thread_ts will exist if the mention was in a thread
    const threadTs = thread_ts || ts;

    const allMessages = await fetchThreadMessages(channelId, threadTs);
    // console.log("🚀 ~ allMessages:", allMessages);

    if (!allMessages || allMessages.length === 0) {
      console.log("No messages found in the thread.");
      return reply.status(200).send({
        text: "No messages found in the thread.",
      });
    }

    // Get all messages except the last one (the mention itself) AND
    // Filter messages that are posted by the bot, or with bot mentions
    const relevantMessages = allMessages.slice(0, -1).filter((msg) => {
      const isFromBot = msg.user === BOT_USER_ID;
      const hasBotMention = msg.text && msg.text.includes(`<@${BOT_USER_ID}>`);
      return !isFromBot && !hasBotMention;
    });

    const formattedMessages = relevantMessages.map((msg) => `${msg.user}: ${msg.text}`).join("\n");
    // console.log("🚀 ~ formattedMessages:", formattedMessages);
    // console.log("🚀 ~ userCommand:", userCommand);

    // const summary = await getGeminiSummary(fullContext);

    // console.log("Generated summary:", summary);
  }
});

// --- Main Startup Function ---
const startServer = async () => {
  try {
    await server.listen({ port: PORT });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

startServer();
