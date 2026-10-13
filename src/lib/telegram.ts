// ============================================================
// TELEGRAM HELPER
// ============================================================

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN;

const TELEGRAM_ADMIN_CHAT_ID =
  process.env.TELEGRAM_ADMIN_CHAT_ID;

// ============================================================
// ТИПЫ
// ============================================================

type TelegramButton = {
  text: string;
  callback_data: string;
};

// ============================================================
// ОТПРАВКА СООБЩЕНИЯ
// ============================================================

export async function sendTelegramMessage(
  text: string,
  buttons?: TelegramButton[][]
) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error(
      "❌ TELEGRAM_BOT_TOKEN не найден"
    );

    return {
      success: false,
      error: "TELEGRAM_BOT_TOKEN не найден",
    };
  }

  if (!TELEGRAM_ADMIN_CHAT_ID) {
    console.error(
      "❌ TELEGRAM_ADMIN_CHAT_ID не найден"
    );

    return {
      success: false,
      error: "TELEGRAM_ADMIN_CHAT_ID не найден",
    };
  }

  try {
    const url =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const body: any = {
      chat_id: TELEGRAM_ADMIN_CHAT_ID,
      text,
      parse_mode: "HTML",
    };

    if (buttons && buttons.length > 0) {
      body.reply_markup = {
        inline_keyboard: buttons,
      };
    }

    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),

      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error(
        "❌ Telegram API ошибка:",
        data
      );

      return {
        success: false,
        error:
          data.description ||
          "Telegram API error",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(
      "❌ Ошибка отправки сообщения в Telegram:",
      error
    );

    return {
      success: false,
      error: String(error),
    };
  }
}

// ============================================================
// УВЕДОМЛЕНИЕ О НОВОМ ЗАКАЗЕ
// ============================================================

export async function sendNewOrderNotification(
  order: {
    id: number;
    customerName: string;
    phone: string;
    city: string;
    address: string;
    contactMethod: string;
    comment: string | null;
    total: number;
    status: string;
    items: Array<{
      productName: string;
      price: number;
      quantity: number;
    }>;
  }
) {
  const itemsText = order.items
    .map((item, index) => {
      const itemTotal =
        item.price * item.quantity;

      return (
        `${index + 1}. <b>${escapeHtml(
          item.productName
        )}</b>\n` +
        `   ${formatPrice(
          item.price
        )} ₽ × ${item.quantity} = ` +
        `<b>${formatPrice(
          itemTotal
        )} ₽</b>`
      );
    })
    .join("\n\n");

  let text =
    "🛒 <b>НОВЫЙ ЗАКАЗ!</b>\n\n" +
    `🆔 Заказ: <b>#${order.id}</b>\n` +
    `📊 Статус: <b>${escapeHtml(
      order.status
    )}</b>\n\n` +

    "👤 <b>КЛИЕНТ</b>\n" +
    `Имя: ${escapeHtml(
      order.customerName
    )}\n` +
    `📞 Телефон: ${escapeHtml(
      order.phone
    )}\n` +
    `🏙 Город: ${escapeHtml(
      order.city
    )}\n` +
    `📍 Адрес: ${escapeHtml(
      order.address
    )}\n` +
    `💬 Связь: ${escapeHtml(
      order.contactMethod
    )}\n`;

  if (order.comment) {
    text +=
      `📝 Комментарий: ${escapeHtml(
        order.comment
      )}\n`;
  }

  text +=
    "\n📦 <b>ТОВАРЫ</b>\n\n" +
    itemsText +
    "\n\n" +
    `💰 <b>ИТОГО: ${formatPrice(
      order.total
    )} ₽</b>\n\n` +
    "👇 <b>Изменить статус заказа:</b>";

  const buttons = [
    [
      {
        text: "🆕 Новый",
        callback_data: `order_status:${order.id}:Новый`,
      },
      {
        text: "📦 В обработке",
        callback_data: `order_status:${order.id}:В обработке`,
      },
    ],

    [
      {
        text: "🚚 Отправлен",
        callback_data: `order_status:${order.id}:Отправлен`,
      },
      {
        text: "✅ Завершён",
        callback_data: `order_status:${order.id}:Завершён`,
      },
    ],

    [
      {
        text: "❌ Отменён",
        callback_data: `order_status:${order.id}:Отменён`,
      },
    ],
  ];

  return sendTelegramMessage(
    text,
    buttons
  );
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function formatPrice(
  value: number
): string {
  return new Intl.NumberFormat(
    "ru-RU"
  ).format(value);
}

function escapeHtml(
  value: string
): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}