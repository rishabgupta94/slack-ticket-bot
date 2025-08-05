// src/app.ts
import fastify from "fastify";
import "dotenv/config"; // Loads .env variables
import axios from "axios";
import formbody from "@fastify/formbody";

type SlackRequestBody = {
  token: string;
  team_id: string;
  api_app_id: string;
  event: {
    type: string;
    user: string;
    text: string;
    ts: string;
    channel: string;
    event_ts: string;
    thread_ts?: string; // Optional, exists if the mention was in a thread
  };
  type: string;
  event_id: string;
  event_time: number;
  authed_users: string[];
};

const server = fastify();
const PORT = 3000;

server.register(formbody);

server.post("/slack/events", async (request, reply) => {
  // FIXME - add typecheck to make sure the type matches
  const body = request.body as SlackRequestBody;

  console.log("Received data:", body);

  if (body.type === "event_callback" && body.event.type === "app_mention") {
    const event = body.event;
    console.log("✅ App mention detected!");

    // Acknowledge the event immediately
    reply.status(200).send();

    const channelId = event.channel;
    // The thread_ts will exist if the mention was in a thread
    const threadTs = event.thread_ts || event.ts;
    const userText = event.text;

    console.log(`Mention was in channel ${channelId}`);
    console.log(`The user wrote: "${userText}"`);
    console.log(`The thread timestamp is: ${threadTs}`);
  }
});

server.listen({ port: PORT }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
