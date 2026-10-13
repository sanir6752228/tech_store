"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password !== passwordRepeat) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось зарегистрироваться.");
      }

      router.push("/profile");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Произошла ошибка."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-block text-2xl font-black tracking-tight"
            >
              TECH<span className="text-green-600">STORE</span>
            </Link>

            <h1 className="text-3xl font-black mt-6">
              Создание аккаунта
            </h1>

            <p className="text-gray-500 mt-2">
              Зарегистрируйтесь, чтобы оформлять заказы и следить за ремонтом.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">
                Имя
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ваше имя"
                required
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@mail.ru"
                required
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Телефон
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 (___) ___-__-__"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Пароль
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Минимум 6 символов"
                required
                minLength={6}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Повторите пароль
              </label>

              <input
                type="password"
                value={passwordRepeat}
                onChange={(event) =>
                  setPasswordRepeat(event.target.value)
                }
                placeholder="Повторите пароль"
                required
                minLength={6}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold transition"
            >
              {loading ? "Создаём аккаунт..." : "Создать аккаунт"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="font-bold text-green-600 hover:text-green-700"
            >
              Войти
            </Link>
          </div>

          <div className="text-center mt-4">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}