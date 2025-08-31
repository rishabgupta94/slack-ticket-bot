import type { ConversationsRepliesResponse, WebAPICallResult, WebClient } from "@slack/web-api";
import type { Message } from "@slack/web-api/dist/types/response/ChannelsRepliesResponse.js";
import { AppError, ErrorType } from "../errors.js";

export type ThreadMessage = ReturnType<typeof formatFetchedThreadMessages>;

// Type-guard for ConversationsRepliesResponse
function isConversationsRepliesResponse(page: WebAPICallResult): page is ConversationsRepliesResponse {
  if (!page || typeof page !== "object") {
    return false;
  }

  return "messages" in page && Array.isArray((page as any).messages);
}

function formatFetchedThreadMessages(messages: Message[], botUserId: string | undefined) {
  if (!messages || messages.length === 0) {
    return;
  }

  // Remove the last message (the mention itself) and filter out bot messages
  const relevantMessages = messages
    .slice(0, -1)
    .filter((msg) => botUserId && msg.user !== botUserId && !msg.text?.includes(botUserId));

  const appMentionUserDirective = messages[messages.length - 1]?.text?.replace(`<@${botUserId}>`, "").trim() || "";
  const formattedThreadContext = relevantMessages.map((msg) => `${msg.user}: ${msg.text}`).join("\n");

  return { formattedThreadContext, appMentionUserDirective };
}

// The function now accepts the Bolt client as an argument
export async function fetchThreadMessages(client: WebClient, channelId: string, threadTs: string, botUserId?: string) {
  try {
    const allMessages: Message[] = [];

    client.conversations.replies;

    for await (const page of client.paginate("conversations.replies", {
      channel: channelId,
      ts: threadTs,
    })) {
      if (isConversationsRepliesResponse(page) && page.messages) {
        allMessages.push(...page.messages);
      } else {
        console.warn("Received an unexpected page format from Slack API:", page);
      }
    }
    return formatFetchedThreadMessages(allMessages, botUserId);
  } catch (error) {
    const errorMessage = "Error fetching thread messages from Slack";
    console.error(errorMessage, error);
    throw new AppError(ErrorType.SLACK_API_ERROR, errorMessage, {
      originalError: error,
    });
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
