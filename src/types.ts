export type SlackRequestBody = {
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
