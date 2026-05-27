import React, { useEffect, useMemo } from "react";
import ContactForm from "../components/contactForm";
import { BsFacebook } from "react-icons/bs";

const contactOptions = [
  {
    label: "Facebook",
    value: "SoapDelight.J",
    href: "https://www.facebook.com/profile.php?id=61555597584696",
    icon: BsFacebook,
  },
];

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const subscribeUrl = useMemo(() => {
    if (typeof window === "undefined") return "/subscribe";
    return `${window.location.origin}/subscribe`;
  }, []);

  const subscribeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(
    subscribeUrl
  )}`;

  return (
    <main className="min-h-screen bg-[#fbfcfa] px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-zinc-200 bg-white px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8 lg:px-10">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
            Contact
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Contact us / 聯絡我們
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
            有產品、訂單或送貨問題？歡迎留下訊息，我們會盡快回覆。
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                Contact options
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Stay in touch
              </h2>
              <div className="mt-6 space-y-3">
                {contactOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <a
                      key={option.label}
                      href={option.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[1.2rem] border border-zinc-200 px-4 py-4 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f8f4] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                          <Icon size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {option.label}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {option.value}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Open
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                Subscribe
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Subscribe for updates / 訂閱最新消息
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                掃描 QR code 訂閱 SoapDelight.J 最新產品、優惠及推廣消息。
              </p>
              <a
                href={subscribeUrl}
                className="mt-6 flex flex-col items-center rounded-[1.5rem] border border-zinc-200 bg-[#fbfcfa] p-5 text-center transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <img
                  src={subscribeQrUrl}
                  alt="Subscribe to SoapDelight.J updates QR code"
                  className="h-44 w-44 rounded-xl bg-white p-2"
                  loading="lazy"
                />
              </a>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-200 bg-[#f7f8f4] px-6 py-8 dark:border-zinc-800 dark:bg-zinc-900 sm:px-8">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                Response
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                We’ll get back to you as soon as we can.
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                如網站內未有列出你想查詢的聯絡資料，歡迎直接透過表格留下訊息，我們會按內容回覆你。
              </p>
            </div>
          </div>

          <section className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Message form
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Send us a message
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              有任何產品、訂單或送貨問題，都可以在這裡留下訊息。
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};

export default Contact;
