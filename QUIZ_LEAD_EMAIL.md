# Quiz Lead Email

The quiz posts completed submissions to `/api/quiz-lead`.

The Cloudflare Pages Function sends one quiz lead email:

- `to`: `QUIZ_LEAD_TO`
- `bcc`: the email entered on the website
- optional extra BCC recipients from `QUIZ_LEAD_BCC`

## Required Cloudflare Env Vars

```text
RESEND_API_KEY=<resend api key>
QUIZ_LEAD_FROM=Dr. Garber Quiz <drgarber@katek-ai.com>
QUIZ_LEAD_TO=office@drgarbers.com
```

For testing before client handoff, temporarily use:

```text
QUIZ_LEAD_TO=industryrockstarteam@gmail.com
```

## Optional Env Var

Use `QUIZ_LEAD_BCC` when another internal person needs a copy.

```text
QUIZ_LEAD_BCC=industryrockstarteam@gmail.com
```

Multiple internal recipients can be comma-separated:

```text
QUIZ_LEAD_TO=office@drgarbers.com,nik@katalyst-crm.com
```

After changing any Cloudflare Pages env var, redeploy the Pages project.
