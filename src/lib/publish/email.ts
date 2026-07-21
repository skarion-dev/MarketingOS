export interface EmailSender {
  send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<{ messageId: string }>;
}

export function createResendSender(apiKey: string): EmailSender {
  return {
    async send(options): Promise<{ messageId: string }> {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Skarion <noreply@skarion.com>",
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend send failed (${res.status}): ${err}`);
      }

      const data = await res.json();
      return { messageId: data.id ?? "" };
    },
  };
}
