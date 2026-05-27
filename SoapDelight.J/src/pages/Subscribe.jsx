import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/apiBase";

const initialState = {
  name: "",
  email: "",
  phone: "",
  emailChannel: true,
  whatsappChannel: false,
  consent: false,
};

export default function Subscribe() {
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const preferredChannels = () => {
    const channels = [];
    if (formData.emailChannel) channels.push("email");
    if (formData.whatsappChannel && formData.phone.trim()) channels.push("whatsapp");
    return channels.length ? channels : ["email"];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!formData.consent) {
      setError("請先同意接收最新消息。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/subscribers/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          preferredChannels: preferredChannels(),
          source: "public-subscribe-page",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "未能完成訂閱，請稍後再試。");
      }

      setMessage(data.message || "感謝你的訂閱。");
      setFormData(initialState);
    } catch (subscribeError) {
      setError(subscribeError.message || "未能完成訂閱，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-[#fbfcfa] px-4 py-12 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-zinc-950 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-[#f5f7f4] px-6 py-10 dark:bg-zinc-900/60 sm:px-8 lg:px-10 lg:py-14">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
            SoapDelight.J 最新消息
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            訂閱最新消息
          </h1>
          <p className="mt-5 text-base leading-8 text-zinc-600 dark:text-zinc-300">
            接收 SoapDelight.J 的新品更新、特別優惠及不定期推廣消息。
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            WhatsApp 目前屬選填，我們只會保存你的接收意願及聯絡號碼，供日後更新使用。
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-800 transition hover:border-zinc-950 hover:bg-white dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-300 dark:hover:bg-zinc-900"
          >
            瀏覽商品
          </Link>
        </div>

        <form className="px-6 py-10 sm:px-8 lg:px-10 lg:py-14" onSubmit={handleSubmit}>
          <div className="grid gap-5">
            <div>
              <label htmlFor="subscribeName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                姓名
              </label>
              <input
                id="subscribeName"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="選填"
                className="block min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-800"
              />
            </div>

            <div>
              <label htmlFor="subscribeEmail" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                電郵
              </label>
              <input
                id="subscribeEmail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="block min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-800"
              />
            </div>

            <div>
              <label htmlFor="subscribePhone" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                WhatsApp 電話
              </label>
              <input
                id="subscribePhone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="選填"
                className="block min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-zinc-800"
              />
            </div>

            <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                <input
                  type="checkbox"
                  name="emailChannel"
                  checked={formData.emailChannel}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span>電郵更新</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                <input
                  type="checkbox"
                  name="whatsappChannel"
                  checked={formData.whatsappChannel}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span>WhatsApp 更新</span>
              </label>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-zinc-300"
              />
              <span>
                我同意接收 SoapDelight.J 的優惠、新品更新及推廣訊息。
              </span>
            </label>

            {message && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "訂閱中..." : "訂閱"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
