# Northwright

Company landing page for **Northwright Software**. Built around the approved True Course ship mark, the navy/copper/ivory palette, and the tagline **Precision for the journey ahead.**

The site presents Northwright as a software product company. It introduces [CleanFeed](https://getcleanfeed.com) and [SlitLogic](https://slitlogic.com), explains the company’s product focus, and provides a contact form. This repository contains the landing page only.

## Run locally

Requires Node.js 20 or newer. There are no third-party dependencies to install.

```sh
npm run dev
```

Open http://127.0.0.1:4173. The server serves `site/` directly; refresh after edits. Set `PORT` to use another port.

```sh
npm run check
npm run build
npm run preview
```

`build` copies the site and Cloudflare Worker into `dist/` and adds content hashes to CSS/JavaScript URLs to prevent stale browser caches. `preview` serves the static pages from that output. Deploy `dist/` to Cloudflare Pages to enable the contact endpoint. The local server is a development utility, not a production server.

## Files

- `site/index.html` — homepage content, metadata, product links, and contact form.
- `site/styles.css` — responsive layout and design tokens.
- `site/main.js` — accessible mobile navigation, footer year, Turnstile, and contact form submission.
- `cloudflare/worker.js`, `cloudflare/routes.json` — contact endpoint and routing; build emits `_worker.js` and `_routes.json`.
- `test/contact.test.mjs` — contact delivery and abuse-rejection tests.
- `site/assets/` — vector ship marks, favicon, and product illustrations.
- `site/thank-you.html`, `privacy.html`, `404.html` — supporting pages.
- `design/` — approved visual references. The homepage copy was revised after the original mockup to emphasize products rather than custom software services.
- `.openai/hosting.json` — the existing Sites project identity and `dist` deployment directory. Do not create a second Site for this repository.

## Brand and content

The flat SVG mark follows the user-approved True Course reference. Colors are navy `#183447`, copper `#B77C4B`, and ivory `#F8F5EC`. A darker copper `#945C33` provides accessible contrast for text and buttons. Typography uses system fonts: Georgia for display headings and Avenir/Segoe UI/Arial for body copy. No font service or CDN is required.

Product descriptions are grounded in the existing CleanFeed marketing source and SlitLogic project documentation. Do not add testimonials, performance figures, customers, certifications, AI/cybersecurity services, or custom-development offerings without approval.

## Contact form

The form sends JSON to `/api/contact`, a Cloudflare Pages advanced-mode Worker. Resend delivers inquiries to `jake.a.mathias@gmail.com`, from `Northwright Software <contact@mail.northwrightsoftware.com>`. The visitor’s email is used only as Reply-To; both sender and recipient are fixed server-side.

Cloudflare Turnstile protects submissions. The Worker validates its token, hostname, and action, rejects cross-origin requests, checks input lengths and values, and limits request bodies to 64 KiB. A honeypot rejects obvious bot submissions. The client retains form contents on failure, prevents concurrent submissions, and redirects only after Resend accepts the message. Resend idempotency keys prevent duplicate sends on a retry of the same submission. Provider acceptance is not proof of inbox delivery.

Configure these **Production** variables in Pages → Settings → Variables and Secrets, then deploy:

- `TURNSTILE_SITE_KEY`: the public key for the **Northwright contact** widget.
- `TURNSTILE_SECRET_KEY`: encrypted secret for server-side verification.
- `RESEND_API_KEY`: encrypted, sending-only key restricted to `mail.northwrightsoftware.com`.

Never put secrets in HTML, client JavaScript, source control, or deployment ZIPs. Missing configuration fails closed with an email fallback. The public config endpoint exposes only the Turnstile site key. The widget allows `northwrightsoftware.com` and its subdomains. The Worker’s hostname allowlist also includes `northwright.pages.dev`, but that hostname must be added to the widget before the form can work there. Other preview hostnames are deliberately disabled.

The form requires JavaScript for verification and submission. A direct email link remains available. The simple local static preview does not execute the Worker and will show the email fallback; use `npx wrangler pages dev dist` with ignored `.dev.vars` for full integration testing. Use Cloudflare’s documented Turnstile test keys only in isolated local tests, never in production.

Live verification completed October 29, 2026 (America/Chicago): the production form redirected to the thank-you page, Resend marked the test **Delivered**, and the message arrived in the recipient’s Gmail **Inbox**. Gmail reported SPF and DKIM passes. The live endpoint rejected GET requests, cross-origin POSTs, and incomplete submissions. The form fit 390 px and 320 px mobile viewports without horizontal overflow.

Run `npm test` for mocked tests of validation, spam protection, provider errors, idempotency, fixed destinations, config secrecy, and asset routing. Repeat the live submission and inbox check if the sender, recipient, domain, or credentials change.

## Hosting and domain

Production hosting is **Cloudflare Pages** in Jake’s Cloudflare account. The Pages project is `northwright`, with its default address at https://northwright.pages.dev. The primary public domain is **www.northwrightsoftware.com**; the canonical URL and sitemap use it.

[Cloudflare Pages project](https://dash.cloudflare.com/d71cd1d088dcd7da616588e7dc01885f/pages/view/northwright)

Both `northwrightsoftware.com` and `www.northwrightsoftware.com` are attached to the Pages project with SSL enabled. Cloudflare created CNAME records for `@` and `www` pointing to `northwright.pages.dev`.

The zone’s enabled Single Redirect rule, **Northwright — redirect root to www**, uses:

- Match: `(http.host eq "northwrightsoftware.com")`
- Target: `concat("https://www.northwrightsoftware.com", http.request.uri.path)`
- Status: `301`; preserve query string: enabled.

Verified at launch: the public homepage loads over HTTPS; HTTP on `www` upgrades to HTTPS; an HTTP apex request to `/privacy.html?launch-check=1` reaches `https://www.northwrightsoftware.com/privacy?launch-check=1`. Pages automatically normalizes HTML page extensions. These are zone settings, not application redirects.

This is a Direct Upload project. To publish changes:

1. Run `npm run check`, `npm test`, and `npm run build`.
2. Open the Cloudflare Pages project and select **Create deployment** → **Production**.
3. Upload the `dist` folder (or a ZIP whose root contains `index.html`, `assets/`, `_worker.js`, and `_routes.json`). Dashboard uploads support this prebuilt Worker. Do not upload the repository, `.git`, or design references.
4. Deploy and verify the public website.

Git commits do not automatically deploy this project. Future automated deployments can use Wrangler/CI with this same Direct Upload project. Cloudflare’s built-in Git integration requires a separate Pages project.

The earlier owner-private Sites project is `appgprj_6ae3fa6347f08191a6e61a0fd34e122d`. Its manifest is retained for that review copy; Cloudflare Pages is the production host. Do not republish the review copy when the intent is to update the public website. Do not commit deployment credentials.

FormSubmit has been removed. Resend domain verification and the three Cloudflare environment values are required before the replacement form can deliver email.
