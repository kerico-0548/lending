# Уведомления в Telegram

Сайт GitHub Pages не требует изменений: уведомление запускается после сохранения новой строки в Supabase. Настройка ниже выполняется владельцем в Dashboard. Публичного ключа из config.js для неё недостаточно.

1. Создайте бота через официальный @BotFather, откройте своего бота и отправьте /start.
2. В Edge Functions → Secrets сохраните TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID. Для личного чата chat_id совпадает с числовым Telegram ID получателя. Никогда не добавляйте токен в GitHub.
3. Edge Functions → Deploy a new function → Via Editor. Имя: telegram-notify. Вставьте весь файл functions/telegram-notify/index.ts и опубликуйте.
4. Для этой функции отключите платформенную проверку legacy JWT (Verify JWT). Функция сама проверяет закрытый ключ проекта через withSupabase({ auth: 'secret' }). При публикации через CLI это уже указано в config.toml. Не заменяйте auth: 'secret' на publishable или none.
5. Database → Webhooks → Create webhook: имя lesson-telegram, таблица public.lesson_applications, только событие INSERT. Тип Supabase Edge Functions; функция telegram-notify; метод POST. В HTTP Headers используйте Add secret key и выберите ключ проекта default. Не вставляйте Publishable key. Если спрашивает тайм-аут, задайте 10000 мс.
6. Отправьте вымышленную заявку с GitHub Pages. Должно прийти сообщение с именем, контактом и номером заявки. Если нет — проверьте Invocations и Logs функции. 403 от Telegram обычно означает, что получатель ещё не нажал Start или заблокировал бота; 400 может означать неправильный chat_id; 401 — неверный токен.

Данные заявок отправляются в указанный Telegram-чат. Сами заявки остаются в БД даже при недоступности Telegram. В этой простой версии отдельной очереди повторной доставки и защиты от дубликатов уведомлений нет; недоставленные заявки нужно смотреть в Table Editor. Старые строки не вызывают уведомления автоматически.

Ключ для webhook хранится в определении триггера Supabase и может попасть в дамп базы: не публикуйте такой дамп в GitHub. Код функции не содержит значений секретов.

Документация:
- https://supabase.com/docs/guides/database/webhooks
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/functions/secrets
