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

// Keep provider redirects on the origin where the form was actually submitted.
// Native POST lets FormSubmit handle validation, spam protection, and activation.
// There is deliberately no client-side "sent" state before provider confirmation.
if (['http:', 'https:'].includes(window.location.protocol)) {
  const returnUrl = document.querySelector('[data-return-url]');
  const sourceUrl = document.querySelector('[data-source-url]');
  if (returnUrl) returnUrl.value = new URL('/thank-you.html', window.location.origin).href;
  if (sourceUrl) sourceUrl.value = new URL('/', window.location.origin).href;
}
