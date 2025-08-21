import axios, { isAxiosError } from "axios";
import { JiraApiError } from "../errors.js";

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
      id: string;
    };
  };
}

interface JiraIssueType {
  id: string;
  name: string;
  description: string;
  subtask: boolean;
}

// FIXME
// export async function getJiraIssueTypes(): Promise<JiraIssueType[] | null> {
//   const { JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN } = process.env;

//   if (!JIRA_BASE_URL || !JIRA_USER_EMAIL || !JIRA_API_TOKEN) {
//     console.error(
//       "Jira auth environment variables are not set. Please check JIRA_BASE_URL, JIRA_USER_EMAIL, and JIRA_API_TOKEN."
//     );
//     return null;
//   }

//   // Using the general endpoint from the official documentation.
//   const url = `${JIRA_BASE_URL}/rest/api/3/issuetype`;
//   const authHeader = `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

//   console.log(`🔷 Fetching all available issue types from: ${url}`);

//   try {
//     const response = await axios.get(url, {
//       headers: {
//         Authorization: authHeader,
//         Accept: "application/json",
//       },
//     });

//     const issueTypes = response.data as JiraIssueType[];
//     console.log("🚀 ~ issueTypes:", issueTypes);

//     if (issueTypes && issueTypes.length > 0) {
//       console.log(`✅ Success! Found ${issueTypes.length} issue types.`);
//       // We are logging the full list here for you to inspect.
//       console.log("--- Available Issue Types ---");
//       console.log(issueTypes.map((it) => ({ id: it.id, name: it.name, description: it.description })));
//       console.log("---------------------------");
//       return issueTypes;
//     } else {
//       console.warn("⚠️ API call succeeded, but no issue types were returned.");
//       return [];
//     }
//   } catch (error: any) {
//     // Enhanced error logging for easier debugging
//     console.error("❌ Error fetching Jira issue types. The API call failed.");
//     if (error.response) {
//       console.error(`Status: ${error.response.status}`);
//       console.error("Data:", JSON.stringify(error.response.data, null, 2));
//     } else {
//       console.error("Error Message:", error.message);
//     }
//     return null;
//   }
// }

export async function createJiraTicket(
  title: string,
  description: string
): Promise<{ key: string; url: string } | null> {
  const { JIRA_BASE_URL, JIRA_USER_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY, JIRA_REPORTER_ID, JIRA_TASK_ID } =
    process.env;

  if (!JIRA_BASE_URL || !JIRA_USER_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY || !JIRA_REPORTER_ID) {
    console.error("Jira environment variables are not fully configured.");
    return null;
  }

  const url = `${JIRA_BASE_URL}/rest/api/3/issue`;
  const authHeader = `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`;

  // Use the first issue type as default
  const ticketData: JiraTicketData = {
    fields: {
      project: {
        key: JIRA_PROJECT_KEY,
      },
      summary: title,
      issuetype: {
        id: JIRA_TASK_ID || "10001", // Default to a common task ID if not set
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
    console.log("🚀 ~ JIRA create issue response:", response);

    const ticketKey = response.data.key;
    const ticketUrl = `${JIRA_BASE_URL}/browse/${ticketKey}`;
    console.log(`✅ Successfully created Jira ticket: ${ticketKey}`);
    return { key: ticketKey, url: ticketUrl };
  } catch (error) {
    let errorMessage = "An unknown error occurred while creating the JIRA ticket.";

    if (isAxiosError(error)) {
      // Enhanced error logging for easier debugging
      const jiraErrors = error.response?.data?.errors || error.response?.data?.errorMessages;
      errorMessage = Array.isArray(jiraErrors) ? jiraErrors.join(", ") : error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error("Error creating JIRA ticket:", errorMessage);

    throw new JiraApiError(`Failed to create Jira ticket: ${errorMessage}`, { originalError: error });
  }
}
