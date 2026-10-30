document.documentElement.classList.add('js');

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuToggle || !navigation) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
  if (restoreFocus) menuToggle.focus();
}

if (menuToggle && navigation) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    navigation.classList.toggle('is-open', !expanded);
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu({ restoreFocus: true });
    }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', () => closeMenu());
}

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  const button = contactForm.querySelector('button[type="submit"]');
  const status = document.querySelector('#contact-status');
  const buttonLabel = button.innerHTML;
  let token = '';
  let widget;
  let sending = false;
  // Keep this ID on retries so a network interruption cannot send the same email twice.
  const requestId = crypto.randomUUID();
  const unavailable = 'The form is temporarily unavailable. Please use the email link to reach us.';

  async function initializeVerification() {
    status.textContent = 'Loading verification…';
    try {
      const configResponse = await fetch('/api/contact/config', { signal: AbortSignal.timeout(10000) });
      if (!configResponse.ok) throw new Error('configuration');
      const config = await configResponse.json();
      if (!config.siteKey) throw new Error('configuration');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        const timeout = setTimeout(() => reject(new Error('verification-timeout')), 15000);
        script.onload = () => { clearTimeout(timeout); resolve(); };
        script.onerror = () => { clearTimeout(timeout); reject(new Error('verification-unavailable')); };
        document.head.appendChild(script);
      });
      const narrowScreen = window.matchMedia('(max-width: 339px)');
      const widgetOptions = {
        sitekey: config.siteKey, action: 'contact', theme: 'light',
        callback(value) { token = value; button.disabled = sending; if (!sending && !status.dataset.error) status.textContent = ''; },
        'expired-callback'() { token = ''; button.disabled = true; },
        'error-callback'() { token = ''; button.disabled = true; status.textContent = 'Verification couldn’t load. Please refresh the page or use the email link.'; },
      };
      function renderWidget() {
        if (widget !== undefined) window.turnstile.remove(widget);
        token = '';
        button.disabled = true;
        widget = window.turnstile.render('#contact-verification', { ...widgetOptions, size: narrowScreen.matches ? 'compact' : 'flexible' });
      }
      renderWidget();
      narrowScreen.addEventListener('change', renderWidget);
      status.textContent = '';
    } catch { status.textContent = unavailable; }
  }

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending || !contactForm.reportValidity()) return;
    if (!token) { status.textContent = 'Please complete the verification before sending.'; return; }
    sending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.textContent = '';
    delete status.dataset.error;
    const fields = Object.fromEntries(new FormData(contactForm));
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, token, requestId }), signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'We couldn’t send your message. Please try again or use the email link.');
      window.location.assign('/thank-you.html');
    } catch (error) {
      status.dataset.error = 'true';
      status.textContent = error.name === 'TimeoutError' || error.name === 'TypeError'
        ? 'We couldn’t confirm your message was sent. Please try again or use the email link.'
        : error instanceof SyntaxError ? unavailable : error.message;
      sending = false;
      token = '';
      button.innerHTML = buttonLabel;
      window.turnstile.reset(widget);
    }
  });
  initializeVerification();
}
