import formbody from "@fastify/formbody";
import axios from "axios";
import "dotenv/config";
import fastify from "fastify";
import type { SlackRequestBody } from "./types.js";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, THINKING_BUDGET } from "./global-consts.js";

const ai = new GoogleGenAI({});

const server = fastify();
const PORT = 3000;

server.register(formbody);

async function getGeminiSummary(context: string) {
  const promptContent = prompt(context);

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: promptContent,
    config: {
      thinkingConfig: {
        thinkingBudget: THINKING_BUDGET,
      },
    },
  });

  if (response.text) {
    return response.text;
  }

  console.error("Error generating content:");
}

async function fetchThreadMessages(channelId: string, threadTs: string): Promise<any[]> {
  try {
    const result = await axios.get("https://slack.com/api/conversations.replies", {
      params: {
        channel: channelId,
        ts: threadTs,
      },
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
    });

    if (result.data.ok) {
      return result.data.messages || [];
    }

    console.error("Slack API error:", result.data.error);
    return [];
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    return [];
  }
}

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

    if (!allMessages || allMessages.length === 0) {
      console.log("No messages found in the thread.");
      return reply.status(200).send({
        text: "No messages found in the thread.",
      });
    }

    // Get all messages except the last one (the mention itself)
    const relevantMessages = allMessages.slice(0, -1);

    console.log("🚀 ~ messages:", relevantMessages);

    const formattedMessages = relevantMessages.map((msg) => `${msg.user}: ${msg.text}`).join("\n");
    console.log("🚀 ~ formattedMessages:", formattedMessages);
    console.log("🚀 ~ userCommand:", userCommand);

    // const summary = await getGeminiSummary(fullContext);

    // console.log("Generated summary:", summary);
  }
});

server.listen({ port: PORT }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
