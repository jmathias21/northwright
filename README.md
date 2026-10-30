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

`build` copies the complete site to `dist/`. `preview` serves that production output. Deploy the contents of `dist/` to any static host. The local server is a development utility, not a production server.

## Files

- `site/index.html` — homepage content, metadata, product links, and contact form.
- `site/styles.css` — responsive layout and design tokens.
- `site/main.js` — accessible mobile navigation, footer year, and form return URLs.
- `site/assets/` — vector ship marks, favicon, and product illustrations.
- `site/thank-you.html`, `privacy.html`, `404.html` — supporting pages.
- `design/` — approved visual references. The homepage copy was revised after the original mockup to emphasize products rather than custom software services.
- `.openai/hosting.json` — the existing Sites project identity and `dist` deployment directory. Do not create a second Site for this repository.

## Brand and content

The flat SVG mark follows the user-approved True Course reference. Colors are navy `#183447`, copper `#B77C4B`, and ivory `#F8F5EC`. A darker copper `#945C33` provides accessible contrast for text and buttons. Typography uses system fonts: Georgia for display headings and Avenir/Segoe UI/Arial for body copy. No font service or CDN is required.

Product descriptions are grounded in the existing CleanFeed marketing source and SlitLogic project documentation. Do not add testimonials, performance figures, customers, certifications, AI/cybersecurity services, or custom-development offerings without approval.

## Contact form

The form uses a native POST to [FormSubmit](https://formsubmit.co/documentation), addressed to `jake.a.mathias@gmail.com`. It retains the provider’s default reCAPTCHA, includes a honeypot, and uses browser validation for required fields and email format. JavaScript never displays a fabricated delivery success state; the provider handles submission and redirects to the thank-you page.

**Activation is required before delivery can be relied on.** Submit the form once from the intended live origin and follow the activation link FormSubmit sends to the recipient inbox. Then submit a real test inquiry and verify receipt. Changing the recipient or origin may require activation again. Do not assume email delivery has been verified by local browser checks.

The `_next` and `_url` hidden fields are adjusted to the current origin, so a preview returns to the preview and the custom domain returns to the custom domain. Without JavaScript, the form uses `https://www.northwrightsoftware.com/thank-you.html`. All controls and product links remain usable without JavaScript.

If FormSubmit provides an opaque endpoint after activation, the email address in the form action can be replaced with that endpoint. A direct email link is also available in the contact section.

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

1. Run `npm run check` and `npm run build`.
2. Open the Cloudflare Pages project and select **Create deployment** → **Production**.
3. Upload the `dist` folder (or a ZIP whose root contains `index.html` and `assets/`). Do not upload the repository, `.git`, or design references.
4. Deploy and verify the public website.

Git commits do not automatically deploy this project. Future automated deployments can use Wrangler/CI with this same Direct Upload project. Cloudflare’s built-in Git integration requires a separate Pages project.

The earlier owner-private Sites project is `appgprj_6ae3fa6347f08191a6e61a0fd34e122d`. Its manifest is retained for that review copy; Cloudflare Pages is the production host. Do not republish the review copy when the intent is to update the public website. Do not commit deployment credentials.

Contact-form activation is separate from hosting. Complete activation and a delivery test from the public domain before relying on form emails.
