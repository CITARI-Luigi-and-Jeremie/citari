interface Attachment {
  filename: string;
  content: string; // base64
}

export async function sendEmail(opts: { to: string; subject: string; html: string; attachments?: Attachment[] }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[resend] RESEND_API_KEY absent — email non envoyé:", opts.subject);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "GEO Sprint <onboarding@resend.dev>",
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}
