import { withSupabase } from 'npm:@supabase/server@1';

// Вставьте весь файл в Edge Functions -> Deploy a new function -> Via Editor.
// Название функции: telegram-notify. Токен и chat_id задаются только в Secrets.
// Принимать запросы разрешено только закрытому ключу проекта (auth: secret).
const json = (body, status = 200) => Response.json(body, { status });

async function notify(request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  if (!token || !chatId || !/^-?\d+$/.test(chatId)) {
    return json({ error: 'Configure TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Secrets' }, 500);
  }

  let event;
  try {
    const body = await request.text();
    if (body.length > 16384) return json({ error: 'Payload too large' }, 413);
    event = JSON.parse(body);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (event.type !== 'INSERT' || event.schema !== 'public' || event.table !== 'lesson_applications') {
    return json({ error: 'Expected INSERT on public.lesson_applications' }, 400);
  }
  const record = event.record;
  if (!record || typeof record.id !== 'string' || record.id.length > 64 ||
      typeof record.name !== 'string' || !record.name.trim() || record.name.length > 80 ||
      typeof record.contact !== 'string' || !record.contact.trim() || record.contact.length > 160) {
    return json({ error: 'Invalid application' }, 400);
  }
  const date = new Date(record.created_at);
  const time = Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  const text = [
    'Новая заявка на занятие',
    '',
    `Имя: ${record.name}`,
    `Контакт: ${record.contact}`,
    ...(time ? [`Время (Москва): ${time}`] : []),
    `Номер: ${record.id}`,
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(8000),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      // Не выводим URL запроса, токен, контакты или тело ответа Telegram в логи.
      console.error('Telegram rejected notification', { status: response.status, code: result.error_code });
      return json({ error: 'Telegram notification failed', code: result.error_code }, 502);
    }
    return json({ ok: true, application_id: record.id });
  } catch {
    console.error('Telegram notification request failed');
    return json({ error: 'Telegram unavailable or timed out' }, 502);
  }
}

Deno.serve(withSupabase({ auth: 'secret' }, notify));
