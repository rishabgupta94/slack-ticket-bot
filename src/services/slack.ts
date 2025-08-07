import axios from "axios";

export async function fetchThreadMessages(channelId: string, threadTs: string): Promise<any[]> {
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
    console.log("🚀 ~ result:", result.data);

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
