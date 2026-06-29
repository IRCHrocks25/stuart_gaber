# Quiz Lead Email

The quiz posts completed submissions to `/api/quiz-lead`.

The Cloudflare Pages Function sends an internal lead email with:

- visitor email
- quiz answers
- recommended protocol
- recommended product link

It also sends a separate receipt email to the visitor with their recommendation and product link.

## Testing Recipient

By default, submissions go to:

```text
industryrockstarteam@gmail.com
```

## Client Recipient

When testing is approved, set this Cloudflare Pages environment variable:

```text
QUIZ_LEAD_TO=office@drgarbers.com
```

## Required Email Env Vars

```text
RESEND_API_KEY=<resend api key>
QUIZ_LEAD_FROM=<verified sender, optional>
```

If `QUIZ_LEAD_FROM` is not set, the function uses:

```text
Dr. Garber Quiz <drgarber@katek-ai.com>
```
