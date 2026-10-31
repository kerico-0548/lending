import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const form = document.querySelector('#application-form');
const button = document.querySelector('#submit');
const status = document.querySelector('#status');
let pendingApplication = null;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  const name = form.elements.name.value.trim();
  const contact = form.elements.contact.value.trim();
  if (!name || !contact) {
    status.textContent = 'Заполните имя и контакт.';
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
    status.textContent = 'Подключение к базе ещё настраивается.';
    return;
  }

  // Повтор запроса после сбоя сети использует тот же ID и не создаёт дубль.
  if (!pendingApplication || pendingApplication.name !== name || pendingApplication.contact !== contact) {
    pendingApplication = { id: crypto.randomUUID(), name, contact };
  }
  button.disabled = true;
  status.textContent = 'Сохраняем…';
  try {
    const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/lesson_applications`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(pendingApplication),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (!(response.status === 409 && error.code === '23505')) {
        throw new Error('Сохранить заявку не удалось. Попробуйте ещё раз.');
      }
    }
    status.textContent = `Заявка сохранена! Номер: ${pendingApplication.id}`;
    pendingApplication = null;
    form.reset();
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' || error instanceof TypeError
      ? 'Не удалось получить ответ. Проверьте интернет и повторите отправку.'
      : error.message;
  } finally {
    button.disabled = false;
  }
});
