import axios from "axios";

interface Paragraph {
  type: "paragraph";
  content: {
    type: "text";
    text: string;
  }[];
}

interface JiraTicketData {
  fields: {
    project: {
      key: string;
    };
    summary: string;
    description: {
      type: "doc";
      version: 1;
      content: Paragraph[];
    };
    issuetype: {
      id: string;
    };
    reporter: {
      id: string; // This is the Atlassian Account ID
    };
  };
}

export async function createJiraTicket(
  title: string,
  description: string
): Promise<{ key: string; url: string } | null> {
  const { JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY, JIRA_ISSUE_TYPE_ID, JIRA_REPORTER_ID } =
    process.env;

  if (
    !JIRA_BASE_URL ||
    !JIRA_USER_EMAIL ||
    !JIRA_API_TOKEN ||
    !JIRA_PROJECT_KEY ||
    !JIRA_ISSUE_TYPE_ID ||
    !JIRA_REPORTER_ID
  ) {
    console.error("Jira environment variables are not fully configured.");
    return null;
  }

  const url = `${JIRA_BASE_URL}/rest/api/3/issue`;
  const authHeader = `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

  const ticketData: JiraTicketData = {
    fields: {
      project: {
        key: JIRA_PROJECT_KEY,
      },
      summary: title,
      issuetype: {
        id: JIRA_ISSUE_TYPE_ID,
      },
      reporter: {
        // Adding the reporter field
        id: JIRA_REPORTER_ID,
      },
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: description }],
          },
        ],
      },
    },
  };

  try {
    console.log(`Creating Jira ticket in project ${JIRA_PROJECT_KEY}...`);
    const response = await axios.post(url, ticketData, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const ticketKey = response.data.key;
    const ticketUrl = `${JIRA_BASE_URL}/browse/${ticketKey}`;
    console.log(`✅ Successfully created Jira ticket: ${ticketKey}`);
    return { key: ticketKey, url: ticketUrl };
  } catch (error: any) {
    console.error(
      "Error creating Jira ticket:",
      error.response?.data?.errors || error.response?.data?.errorMessages || error.message
    );
    return null;
  }
}
