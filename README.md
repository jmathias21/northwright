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

The intended public domain is **www.northwrightsoftware.com**. The canonical URL and sitemap use it. Building this repository does not configure DNS, make the domain live, or verify mailbox delivery.

The existing owner-private Sites project is `appgprj_6ae3fa6347f08191a6e61a0fd34e122d`; its manifest is retained for the review deployment. Publishing to the public domain requires selecting/configuring a host and its DNS records, enabling the intended public audience, and completing contact-form activation on the live origin. Do not commit deployment credentials.
