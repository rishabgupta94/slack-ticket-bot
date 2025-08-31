import type { ConversationsRepliesResponse, WebAPICallResult, WebClient } from "@slack/web-api";
import type { Message } from "@slack/web-api/dist/types/response/ChannelsRepliesResponse.js";
import { AppError, ErrorType } from "../errors.js";

// Type-guard for ConversationsRepliesResponse
function isConversationsRepliesResponse(page: WebAPICallResult): page is ConversationsRepliesResponse {
  if (!page || typeof page !== "object") {
    return false;
  }

  return "messages" in page && Array.isArray((page as any).messages);
}

// The function now accepts the Bolt client as an argument
export async function fetchThreadMessages(client: WebClient, channelId: string, threadTs: string): Promise<Message[]> {
  try {
    const allMessages: Message[] = [];

    client.conversations.replies;

    // The client's built-in paginator handles the loops and cursors for you automatically.
    // This is the most efficient and modern way to handle pagination.
    for await (const page of client.paginate("conversations.replies", {
      channel: channelId,
      ts: threadTs,
    })) {
      if (isConversationsRepliesResponse(page) && page.messages) {
        allMessages.push(...page.messages);
      }
    }
    return allMessages;
  } catch (error) {
    console.error("Error fetching thread messages with Bolt client:", error);
    return [];
  }
}

export async function handleSlackPost<T>(fn: Promise<T>) {
  try {
    await fn;
  } catch (error: any) {
    console.error("Error posting message to Slack", error);
    throw new AppError(ErrorType.SLACK_API_ERROR, error.message, { originalError: error });
  }
}
