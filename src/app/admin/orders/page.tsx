
"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  contactMethod: string;
  comment: string | null;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

const statuses = [
  "Новый",
  "Подтверждён",
  "В обработке",
  "Готов",
  "Выдан",
  "Отменён",
];

function formatPrice(price: number) {
  return price.toLocaleString("ru-RU");
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status: string) {
  switch (status) {
    case "Новый":
      return "bg-yellow-100 text-yellow-700";

    case "Подтверждён":
      return "bg-blue-100 text-blue-700";

    case "В обработке":
      return "bg-purple-100 text-purple-700";

    case "Готов":
      return "bg-green-100 text-green-700";

    case "Выдан":
      return "bg-gray-100 text-gray-700";

    case "Отменён":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  /*
   * Заказ, который сейчас подтверждаем
   * для удаления.
   */
  const [deleteModalOrder, setDeleteModalOrder] =
    useState<Order | null>(null);

  /*
   * Состояние процесса удаления.
   */
  const [deleting, setDeleting] =
    useState(false);

  /*
   * ============================================
   * ЗАГРУЗКА ЗАКАЗОВ
   * ============================================
   */

  async function loadOrders() {
    try {
      setError("");

      const response = await fetch(
        "/api/admin/orders",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ошибка загрузки заказов"
        );
      }

      setOrders(
        Array.isArray(data) ? data : []
      );
    } catch (error: any) {
      console.error(error);

      setError(
        error.message ||
          "Не удалось загрузить заказы"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /*
   * ============================================
   * ИЗМЕНЕНИЕ СТАТУСА
   * ============================================
   */

  async function changeStatus(
    orderId: number,
    status: string
  ) {
    try {
      const response = await fetch(
        "/api/admin/orders",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            orderId,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ошибка изменения статуса"
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? data
            : order
        )
      );

      setSelectedOrder((currentOrder) =>
        currentOrder?.id === orderId
          ? data
          : currentOrder
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error.message ||
          "Не удалось изменить статус"
      );
    }
  }

  /*
   * ============================================
   * ОТКРЫТИЕ ОКНА УДАЛЕНИЯ
   * ============================================
   */

  function deleteOrder(order: Order) {
    /*
     * Дополнительная защита.
     *
     * Удалять можно только заказ
     * со статусом "Выдан".
     */

    if (order.status !== "Выдан") {
      alert(
        "Удалять можно только выполненные заказы со статусом «Выдан»."
      );

      return;
    }

    /*
     * Вместо window.confirm()
     * открываем красивое собственное окно.
     */

    setDeleteModalOrder(order);
  }

  /*
   * ============================================
   * ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ
   * ============================================
   */

  async function confirmDeleteOrder() {
    if (!deleteModalOrder) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        "/api/admin/orders",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            orderId:
              deleteModalOrder.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ошибка удаления заказа"
        );
      }

      /*
       * Убираем заказ из списка
       * без перезагрузки страницы.
       */

      setOrders((currentOrders) =>
        currentOrders.filter(
          (item) =>
            item.id !==
            deleteModalOrder.id
        )
      );

      /*
       * Если заказ был открыт,
       * закрываем окно подробностей.
       */

      if (
        selectedOrder?.id ===
        deleteModalOrder.id
      ) {
        setSelectedOrder(null);
      }

      /*
       * Закрываем окно удаления.
       */

      setDeleteModalOrder(null);
    } catch (error: any) {
      console.error(error);

      alert(
        error.message ||
          "Не удалось удалить заказ"
      );
    } finally {
      setDeleting(false);
    }
  }

  /*
   * ============================================
   * ЗАГРУЗКА
   * ============================================
   */

  if (loading) {
    return (
      <div className="p-10 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-black">
          Заказы
        </h1>

        <div className="bg-white rounded-3xl p-8 mt-10">
          Загрузка заказов...
        </div>
      </div>
    );
  }

  /*
   * ============================================
   * СТРАНИЦА
   * ============================================
   */

  return (
    <div className="p-10 bg-gray-100 min-h-screen">

      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black">
            Заказы
          </h1>

          <p className="text-gray-500 mt-2">
            Всего заказов:{" "}
            <span className="font-bold text-black">
              {orders.length}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="
            bg-black
            text-white
            px-5
            py-3
            rounded-xl
            font-bold
            hover:bg-gray-800
            transition
          "
        >
          ↻ Обновить
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="
            bg-red-50
            border
            border-red-200
            text-red-700
            rounded-2xl
            p-5
            mt-6
          "
        >
          {error}
        </div>
      )}

      {/* EMPTY */}

      {orders.length === 0 ? (
        <div
          className="
            bg-white
            rounded-3xl
            p-10
            mt-10
            text-center
          "
        >
          <div className="text-5xl mb-4">
            📦
          </div>

          <h2 className="text-2xl font-black">
            Заказов пока нет
          </h2>

          <p className="text-gray-500 mt-2">
            Когда клиент оформит заказ,
            он появится здесь.
          </p>
        </div>
      ) : (
        <div className="space-y-5 mt-10">

          {orders.map((order) => (
            <div
              key={order.id}
              className="
                bg-white
                rounded-3xl
                p-8
                shadow-sm
              "
            >
              <div
                className="
                  flex
                  flex-col
                  lg:flex-row
                  lg:items-center
                  gap-6
                "
              >

                {/* НОМЕР */}

                <div>
                  <div className="text-sm text-gray-400">
                    Заказ
                  </div>

                  <div className="text-2xl font-black">
                    #{order.id}
                  </div>
                </div>

                {/* КЛИЕНТ */}

                <div className="flex-1">
                  <div className="font-black text-lg">
                    {order.customerName}
                  </div>

                  <div className="text-gray-500">
                    📞 {order.phone}
                  </div>

                  <div className="text-gray-500">
                    📍 {order.city},{" "}
                    {order.address}
                  </div>
                </div>

                {/* СУММА */}

                <div>
                  <div className="text-sm text-gray-400">
                    Сумма
                  </div>

                  <div className="text-2xl font-black">
                    {formatPrice(
                      order.total
                    )}{" "}
                    ₽
                  </div>
                </div>

                {/* СТАТУС */}

                <span
                  className={`
                    px-4
                    py-2
                    rounded-full
                    text-sm
                    font-bold
                    ${getStatusClass(
                      order.status
                    )}
                  `}
                >
                  {order.status}
                </span>

                {/* ПОДРОБНЕЕ */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrder(order)
                  }
                  className="
                    bg-gray-100
                    hover:bg-gray-200
                    px-5
                    py-3
                    rounded-xl
                    font-bold
                    transition
                  "
                >
                  Подробнее
                </button>
              </div>

              <div className="text-sm text-gray-400 mt-5">
                Создан:{" "}
                {formatDate(
                  order.createdAt
                )}
              </div>
            </div>
          ))}

        </div>
      )}

      {/* ==========================================
          ОКНО ПОДРОБНОСТЕЙ
      ========================================== */}

      {selectedOrder && (
        <div
          className="
            fixed
            inset-0
            bg-black/50
            z-50
            flex
            items-center
            justify-center
            p-5
          "
          onClick={() =>
            setSelectedOrder(null)
          }
        >
          <div
            className="
              bg-white
              rounded-3xl
              w-full
              max-w-3xl
              max-h-[90vh]
              overflow-y-auto
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div
              className="
                p-7
                border-b
                flex
                items-center
                justify-between
              "
            >
              <div>
                <div className="text-sm text-gray-400">
                  Заказ
                </div>

                <h2 className="text-3xl font-black">
                  #{selectedOrder.id}
                </h2>
              </div>

              <div className="flex items-center gap-3">

                {/* УДАЛИТЬ */}

                {selectedOrder.status ===
                  "Выдан" && (
                  <button
                    type="button"
                    onClick={() =>
                      deleteOrder(
                        selectedOrder
                      )
                    }
                    className="
                      bg-red-50
                      text-red-600
                      hover:bg-red-100
                      px-4
                      py-2
                      rounded-xl
                      font-bold
                      transition
                    "
                  >
                    🗑 Удалить
                  </button>
                )}

                {/* ЗАКРЫТЬ */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrder(null)
                  }
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-gray-100
                    hover:bg-gray-200
                    text-xl
                    transition
                  "
                >
                  ×
                </button>

              </div>
            </div>

            <div className="p-7 space-y-7">

              {/* СТАТУС */}

              <div>
                <h3 className="font-black mb-3">
                  Статус
                </h3>

                <select
                  value={
                    selectedOrder.status
                  }
                  onChange={(event) =>
                    changeStatus(
                      selectedOrder.id,
                      event.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    border-gray-200
                    rounded-xl
                    px-4
                    py-3
                    font-bold
                    outline-none
                    focus:ring-2
                    focus:ring-green-400
                  "
                >
                  {statuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* КЛИЕНТ */}

              <div>
                <h3 className="font-black text-xl mb-4">
                  Клиент
                </h3>

                <div
                  className="
                    bg-gray-50
                    rounded-2xl
                    p-5
                    space-y-3
                  "
                >
                  <p>
                    <span className="text-gray-400">
                      Имя:
                    </span>{" "}
                    <b>
                      {
                        selectedOrder.customerName
                      }
                    </b>
                  </p>

                  <p>
                    <span className="text-gray-400">
                      Телефон:
                    </span>{" "}
                    <b>
                      {selectedOrder.phone}
                    </b>
                  </p>

                  <p>
                    <span className="text-gray-400">
                      Город:
                    </span>{" "}
                    <b>
                      {selectedOrder.city}
                    </b>
                  </p>

                  <p>
                    <span className="text-gray-400">
                      Адрес:
                    </span>{" "}
                    <b>
                      {selectedOrder.address}
                    </b>
                  </p>

                  <p>
                    <span className="text-gray-400">
                      Связь:
                    </span>{" "}
                    <b>
                      {
                        selectedOrder.contactMethod
                      }
                    </b>
                  </p>
                </div>
              </div>

              {/* ТОВАРЫ */}

              <div>
                <h3 className="font-black text-xl mb-4">
                  Товары
                </h3>

                <div className="space-y-3">
                  {selectedOrder.items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="
                          bg-gray-50
                          rounded-2xl
                          p-5
                          flex
                          justify-between
                          gap-5
                        "
                      >
                        <div>
                          <div className="font-bold">
                            {item.productName}
                          </div>

                          <div className="text-gray-500 text-sm mt-1">
                            {formatPrice(
                              item.price
                            )}{" "}
                            ₽ ×{" "}
                            {item.quantity}
                          </div>
                        </div>

                        <div className="font-black whitespace-nowrap">
                          {formatPrice(
                            item.price *
                              item.quantity
                          )}{" "}
                          ₽
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* КОММЕНТАРИЙ */}

              {selectedOrder.comment && (
                <div>
                  <h3 className="font-black text-xl mb-4">
                    Комментарий
                  </h3>

                  <div className="bg-yellow-50 rounded-2xl p-5">
                    {selectedOrder.comment}
                  </div>
                </div>
              )}

              {/* ИТОГО */}

              <div
                className="
                  border-t
                  pt-6
                  flex
                  justify-between
                  items-center
                "
              >
                <span className="text-gray-500">
                  Итого
                </span>

                <span className="text-3xl font-black">
                  {formatPrice(
                    selectedOrder.total
                  )}{" "}
                  ₽
                </span>
              </div>

              {/* НИЖНЯЯ КНОПКА УДАЛЕНИЯ */}

              {selectedOrder.status ===
                "Выдан" && (
                <button
                  type="button"
                  onClick={() =>
                    deleteOrder(
                      selectedOrder
                    )
                  }
                  className="
                    w-full
                    bg-red-500
                    hover:bg-red-600
                    text-white
                    py-4
                    rounded-2xl
                    font-black
                    transition
                  "
                >
                  🗑 Удалить выполненный заказ
                </button>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          КРАСИВОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ
      ========================================== */}

      {deleteModalOrder && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            p-5
            bg-black/60
            backdrop-blur-sm
          "
          onClick={() => {
            if (!deleting) {
              setDeleteModalOrder(null);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-md
              bg-white
              rounded-[28px]
              shadow-2xl
              overflow-hidden
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ВЕРХНЯЯ ЧАСТЬ */}

            <div className="p-7 pb-5">

              <div className="flex items-start justify-between">

                <div
                  className="
                    w-16
                    h-16
                    rounded-2xl
                    bg-red-50
                    flex
                    items-center
                    justify-center
                    text-3xl
                  "
                >
                  🗑️
                </div>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setDeleteModalOrder(null)
                  }
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-gray-100
                    hover:bg-gray-200
                    text-gray-500
                    hover:text-gray-900
                    text-2xl
                    flex
                    items-center
                    justify-center
                    transition
                    disabled:opacity-50
                  "
                >
                  ×
                </button>

              </div>

              <h2
                className="
                  text-2xl
                  font-black
                  text-gray-900
                  mt-6
                "
              >
                Удалить заказ?
              </h2>

              <p
                className="
                  text-gray-500
                  mt-2
                  leading-relaxed
                "
              >
                Вы собираетесь окончательно
                удалить выполненный заказ.
                Это действие нельзя отменить.
              </p>

              {/* ИНФОРМАЦИЯ О ЗАКАЗЕ */}

              <div
                className="
                  mt-6
                  rounded-2xl
                  bg-gray-50
                  border
                  border-gray-100
                  p-5
                  space-y-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span className="text-gray-500">
                    Заказ
                  </span>

                  <span className="font-black text-gray-900">
                    #{deleteModalOrder.id}
                  </span>
                </div>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <span className="text-gray-500">
                    Клиент
                  </span>

                  <span
                    className="
                      font-bold
                      text-gray-900
                      text-right
                    "
                  >
                    {
                      deleteModalOrder.customerName
                    }
                  </span>
                </div>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >
                  <span className="text-gray-500">
                    Сумма
                  </span>

                  <span className="font-black text-gray-900">
                    {formatPrice(
                      deleteModalOrder.total
                    )}{" "}
                    ₽
                  </span>
                </div>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span className="text-gray-500">
                    Статус
                  </span>

                  <span
                    className="
                      px-3
                      py-1.5
                      rounded-full
                      bg-gray-200
                      text-gray-700
                      text-sm
                      font-bold
                    "
                  >
                    ✓ Выдан
                  </span>
                </div>

              </div>

              {/* ПРЕДУПРЕЖДЕНИЕ */}

              <div
                className="
                  mt-5
                  rounded-2xl
                  bg-red-50
                  border
                  border-red-100
                  p-4
                  flex
                  gap-3
                "
              >
                <div className="text-xl">
                  ⚠️
                </div>

                <p
                  className="
                    text-sm
                    text-red-700
                    leading-relaxed
                  "
                >
                  Заказ и все связанные с ним
                  позиции будут удалены из базы
                  данных без возможности
                  восстановления.
                </p>
              </div>

            </div>

            {/* КНОПКИ */}

            <div
              className="
                p-7
                pt-2
                flex
                flex-col
                sm:flex-row
                gap-3
              "
            >

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteModalOrder(null)
                }
                className="
                  flex-1
                  py-3.5
                  rounded-2xl
                  bg-gray-100
                  hover:bg-gray-200
                  text-gray-800
                  font-bold
                  transition
                  disabled:opacity-50
                "
              >
                Отмена
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteOrder}
                className="
                  flex-1
                  py-3.5
                  rounded-2xl
                  bg-red-500
                  hover:bg-red-600
                  text-white
                  font-black
                  transition
                  shadow-lg
                  shadow-red-500/20
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >
                {deleting ? (
                  <>
                    <span
                      className="
                        w-5
                        h-5
                        border-2
                        border-white/40
                        border-t-white
                        rounded-full
                        animate-spin
                      "
                    />

                    Удаление...
                  </>
                ) : (
                  <>
                    🗑️ Удалить
                  </>
                )}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
