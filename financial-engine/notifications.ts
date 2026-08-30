import type { FinancialAlert } from "./alerts.ts";

/**
 * Dispatches a real-time slack alert notification via an incoming webhook
 * when a HIGH severity operational exposure event is detected.
 */
export async function sendSlackAlertNotification(
  alert: FinancialAlert,
  webhookUrl: string | undefined = process.env.SLACK_WEBHOOK_URL
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    console.warn("Slack notification skipped: SLACK_WEBHOOK_URL is not configured.");
    return false;
  }

  // PII & Security Policy: Restrict payload to non-sensitive operational summary fields only.
  // Never attach customer bank details, account IDs, tax identifiers, or individual ledger entries.
  const payload = {
    text: `⚠️ *FinanceGuard Exposure Triggered: ${alert.title}*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `⚠️ *FinanceGuard Exposure Alert - ${alert.severity} Severity*`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Category:*\n${alert.category}` },
          { type: "mrkdwn", text: `*Severity:*\n${alert.severity}` },
        ],
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Signal Impact:*\n${alert.whatHappened}` },
          { type: "mrkdwn", text: `*Recommended Action:*\n${alert.recommendedAction}` },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API responded with status ${response.status}`);
    }

    return true;
  } catch (err) {
    console.error("Slack alert dispatch failed:", err);
    return false;
  }
}
