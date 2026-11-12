/** Mailing-list form: submits with fetch (the form also works without JavaScript). */
const form = document.querySelector<HTMLFormElement>('[data-subscribe]');

if (form) {
  const button = form.querySelector('button')!;
  const status = form.querySelector<HTMLElement>('.status')!;

  const params = new URLSearchParams(location.search);
  if (params.has('subscribed')) status.textContent = status.dataset[params.get('subscribed') === '1' ? 'ok' : 'error']!;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    button.textContent = button.dataset.busy!;
    let ok = false;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    button.disabled = false;
    button.textContent = button.dataset.idle!;
    status.textContent = status.dataset[ok ? 'ok' : 'error']!;
    if (ok) form.reset();
    setTimeout(() => (status.textContent = ''), 10_000);
  });
}
