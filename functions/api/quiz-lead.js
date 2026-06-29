function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function splitEmails(value) {
  return String(value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function answerLines(answers) {
  if (!Array.isArray(answers)) return '';
  return answers
    .map((item) => {
      const selected = Array.isArray(item.answers) ? item.answers : [];
      const lines = selected.map((answer) => `- ${answer.text || ''} (${answer.tag || ''})`);
      return `Q${item.question}: ${item.prompt || ''}\n${lines.join('\n')}`;
    })
    .join('\n\n');
}

function answerHtml(answers) {
  if (!Array.isArray(answers)) return '';
  return answers
    .map((item) => {
      const selected = Array.isArray(item.answers) ? item.answers : [];
      const list = selected
        .map((answer) => `
          <li style="margin:8px 0;color:#33413a;line-height:1.5;">
            ${escapeHtml(answer.text || '')}
            <span style="color:#718078;">(${escapeHtml(answer.tag || '')})</span>
          </li>
        `)
        .join('');
      return `
        <div style="border:1px solid #dfe5dc;border-radius:12px;padding:16px;margin:14px 0;background:#fbfcf8;">
          <h3 style="margin:0 0 10px;color:#27372f;font-size:16px;line-height:1.35;">
            Q${escapeHtml(item.question || '')}: ${escapeHtml(item.prompt || '')}
          </h3>
          <ul style="padding-left:20px;margin:0;">${list}</ul>
        </div>
      `;
    })
    .join('');
}

function emailShell(preheader, content) {
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <div style="margin:0;padding:0;background:#f4f1e8;font-family:Arial,Helvetica,sans-serif;color:#27372f;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f4f1e8;">
        <tr>
          <td align="center" style="padding:28px 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e1ddcf;">
              ${content}
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

async function sendEmail(env, message) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) {
    return json({ error: 'Email service is not configured' }, 500);
  }
  if (!env.QUIZ_LEAD_TO || !env.QUIZ_LEAD_FROM) {
    return json({ error: 'Email recipients are not configured' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const email = String(payload.email || '').trim();
  if (!isEmail(email)) return json({ error: 'Valid email is required' }, 400);

  const resultTitle = String(payload.resultTitle || 'Quiz result').trim();
  const resultBody = String(payload.resultBody || '').trim();
  const productLink = String(payload.productLink || '').trim();
  const productCta = String(payload.productCta || 'View recommended product').trim();
  const resultKey = String(payload.resultKey || '').trim();
  const recipients = splitEmails(env.QUIZ_LEAD_TO);
  const bcc = [...new Set([email, ...splitEmails(env.QUIZ_LEAD_BCC)])];
  const sender = env.QUIZ_LEAD_FROM;
  if (!recipients.length || recipients.some((recipient) => !isEmail(recipient))) {
    return json({ error: 'Internal email recipient is invalid' }, 500);
  }
  if (bcc.some((recipient) => !isEmail(recipient))) {
    return json({ error: 'BCC email recipient is invalid' }, 500);
  }

  const leadSubject = `Dr. Garber quiz lead: ${email}`;
  const leadText = [
    `New Dr. Garber quiz lead`,
    ``,
    `Email: ${email}`,
    `Result: ${resultTitle}`,
    `Result key: ${resultKey}`,
    `Recommendation link: ${productLink}`,
    ``,
    `Quiz answers:`,
    answerLines(payload.answers),
  ].join('\n');

  const leadHtml = emailShell(`New quiz lead from ${email}`, `
    <tr>
      <td style="background:#27372f;padding:28px 30px;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#c7d4bd;margin-bottom:8px;">Dr. Garber Quiz</div>
        <h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:500;">New quiz lead</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 30px;">
        <div style="background:#f7f5ed;border-radius:14px;padding:18px;margin-bottom:22px;">
          <p style="margin:0 0 8px;color:#5b665f;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">Visitor email</p>
          <p style="margin:0;font-size:20px;color:#27372f;"><a href="mailto:${escapeHtml(email)}" style="color:#27372f;text-decoration:none;">${escapeHtml(email)}</a></p>
        </div>
        <h2 style="margin:0 0 10px;color:#27372f;font-size:20px;line-height:1.3;">${escapeHtml(resultTitle)}</h2>
        ${resultBody ? `<p style="margin:0 0 18px;color:#526058;line-height:1.6;">${escapeHtml(resultBody)}</p>` : ''}
        <p style="margin:0 0 18px;color:#526058;line-height:1.6;"><strong>Result key:</strong> ${escapeHtml(resultKey || 'n/a')}</p>
        <div style="background:#ffffff;border:1px solid #e6e1d4;border-radius:14px;padding:16px;margin:0 0 24px;">
          <p style="margin:0 0 8px;color:#5b665f;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">Recommendation link</p>
          <p style="margin:0;color:#27372f;line-height:1.5;word-break:break-word;"><a href="${escapeHtml(productLink)}" style="color:#27372f;text-decoration:underline;font-weight:700;">${escapeHtml(productLink || productCta)}</a></p>
        </div>
        <h2 style="margin:26px 0 10px;color:#27372f;font-size:20px;">Quiz answers</h2>
        ${answerHtml(payload.answers)}
        <div style="border-top:1px solid #e6e1d4;margin-top:24px;padding-top:18px;color:#69756d;font-size:13px;line-height:1.6;">
          <p style="margin:0;"><strong>Internal recipient:</strong> ${escapeHtml(recipients.join(', '))}</p>
          ${bcc.length ? `<p style="margin:4px 0 0;"><strong>BCC:</strong> ${escapeHtml(bcc.join(', '))}</p>` : ''}
        </div>
      </td>
    </tr>
  `);

  try {
    await sendEmail(env, {
      from: sender,
      to: recipients,
      ...(bcc.length ? { bcc } : {}),
      reply_to: email,
      subject: leadSubject,
      text: leadText,
      html: leadHtml,
    });
  } catch (err) {
    return json({ error: 'Email send failed', detail: err.message }, 502);
  }

  return json({ ok: true });
}
