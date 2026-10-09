# QALIM tickTack website

A small, mobile-first website for QALIM tickTack: a playful home page with a solo warm-up, three game modes and four download channels, plus one help page containing FAQ, privacy, safety and account removal. Plain HTML/CSS/JavaScript, one SMTP endpoint, no frontend framework or tracking scripts.

## Preview locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:3001`. Routes:

- `/` — game introduction and downloads
- `/help#faq` — help
- `/privacy-policy` — privacy section
- `/child-safety` — safety standards
- `/request-account-removal` — deletion form

The local server reads your shell environment. For local SMTP testing, set environment variables in that terminal; a `.env` file is not loaded automatically. Without SMTP, direct submission returns a clear unavailable message and retains the form values. The visitor may choose the separate email-app option instead. Automated tests never send actual emails.

## Deploy from this GitHub repo to Vercel

Import `mwaikange/qalim_website`, select **Other** as the framework and use the repository root. `vercel.json` sets `npm run build` and the static output folder `public`. Vercel automatically deploys `api/request.js` as a Node 24 serverless function.

Add these server-only environment variables to the production deployment:

| Variable | Value |
| --- | --- |
| `SMTP_HOST` | Your mail provider's SMTP server |
| `SMTP_PORT` | `587` (STARTTLS), `465` (TLS), or `2525` if your provider supports STARTTLS there |
| `SMTP_USER` | Mail account/user |
| `SMTP_PASS` | Mail password or app password |
| `SMTP_FROM` | A sender authorised by your provider, e.g. `QALIM <support@mwaikange.com>` |
| `SITE_URL` | The final HTTPS website origin, once you choose it; generates sitemap/robots links |

Redeploy after adding variables. Port 25 is not supported. TLS verification remains enabled. The recipient is fixed to **support@mwaikange.com**, regardless of visitor input. The registered email becomes the reply-to address. Data is sent as plain text. A successful response means the SMTP server accepted the support recipient, not that deletion has already happened. Check your inbox/spam and sender-domain configuration with a real submission before using the URL for a store review. Actual SMTP delivery is unverified until you configure credentials.

Requests are checked for same-origin submission, size, email format, acknowledgement, honeypot and a best-effort per-instance sending limit. The limiter is not shared across serverless instances. If traffic or abuse increases, add a distributed rate limit in Vercel Firewall. Submitted details and SMTP errors are not written to application logs or a website database.

## Add the four download links

Edit `public/site-config.js`: `apple`, `google`, `huawei` and `apk`. Use the real HTTPS listing or APK URLs. Empty entries show **Coming soon** and do not lead to fake listings. The web-play link already opens the existing game. No Samsung or Amazon badges are included.

## Process requests

Account deletion is a **manual support process**, not an automatic database action from an unauthenticated public form:

1. Reply to the registered email and verify ownership before deletion. Never ask for passwords or verification codes.
2. In the game's Supabase project, remove or de-identify the user's associated live game/challenge records and push device registrations. Existing game participant foreign keys can block account deletion until those records are handled; deleting a shared match also removes it from the other player's history.
3. Delete the verified user in Supabase Authentication. Verify that the linked player profile and applicable records have been removed, and confirm completion to the requester. Aim for the published 30-day period after verification. Retain information only where legally necessary and explain an exception if one applies.
4. Review privacy and safety requests promptly. Restrict access to the support mailbox, avoid keeping correspondence longer than needed and never request explicit images or CSAM.

Do not simply delete a profile row and tell the user their authentication account is gone. Provider backups have their own expiry; do not promise immediate erasure from every backup.

## Store submission checklist

Use the final public `/privacy-policy` URL for privacy and `/request-account-removal` for external account deletion. Also add an easily discoverable **in-app** account-deletion route/link; the external website alone does not satisfy Google's in-app deletion requirement. No game/native changes to add that route are included in this website repo. Keep the app name and URLs consistent in store listings.

The privacy policy describes email, player name, game records, optional push token and operational logs; it should not be described as collecting only email. Review Play Data safety declarations against the actual app and SDK behaviour. Choose the intended age audience and assess Families requirements if the app targets children. Published safety standards do not replace age/audience declarations, operational reporting or legally required action. This website does not guarantee store approval.

Official references: [Google Play user data](https://support.google.com/googleplay/android-developer/answer/10144311), [account deletion](https://support.google.com/googleplay/android-developer/answer/13327111), [child safety standards](https://support.google.com/googleplay/android-developer/answer/14747720), [Vercel SMTP](https://vercel.com/kb/guide/serverless-functions-and-smtp), [Nodemailer SMTP](https://nodemailer.com/smtp).

## Checks

```powershell
npm run build
npm test
```

Also check phone/tablet widths, keyboard focus, the solo warm-up, form type buttons, failure states, email-app fallback and all four store links when available. The build checks local assets and the two page structures. Request tests cover fixed delivery routing, input validation, missing SMTP, failed delivery, origin/body controls and throttling.
