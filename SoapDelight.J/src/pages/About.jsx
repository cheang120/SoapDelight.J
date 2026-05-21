import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const values = [
  {
    title: "小批量手作",
    description: "每一件作品都以細緻手作方式完成，保留小批量製作的溫度與質感。",
  },
  {
    title: "天然靈感",
    description: "從植物、香氣與日常護理習慣出發，保持乾淨溫和的使用感。",
  },
  {
    title: "溫和日常護理",
    description: "我們重視 everyday care 的舒服節奏，讓產品自然融入生活。",
  },
  {
    title: "本地小店溫度",
    description: "來自澳門的小品牌，希望把安心、溫柔與手作細節帶到每一次使用。",
  },
];

const categories = ["個人護理", "手作皂", "香薰蠟", "精選禮物"];

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfcfa] px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
                About
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                About SoapDelight.J
              </h1>
              <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">
                關於 SoapDelight.J
              </p>
              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
                SoapDelight.J is a small handmade skincare, soap, and candle
                brand based in Macau. We focus on gentle daily care, natural
                inspiration, and small-batch handmade details.
              </p>
            </div>

            <div className="grid min-h-[260px] grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800">
              {values.slice(0, 4).map((value) => (
                <div
                  key={value.title}
                  className="flex items-end bg-[#f7f8f4] p-6 dark:bg-zinc-900"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Brand value
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                      {value.title}
                    </h2>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Brand Story
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Handmade care with a gentle daily rhythm.
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-600 dark:text-zinc-300">
              SoapDelight.J 以小批量手作方式製作護膚品、手工皂及香薰蠟，重視天然成分、日常使用感和每一件作品的細節。每一件作品都希望為日常護理帶來一點溫柔、安心和手作的溫度。
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-200 bg-[#f7f8f4] px-6 py-8 dark:border-zinc-800 dark:bg-zinc-900 sm:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Collections
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              What we make
            </h2>
            <div className="mt-6 grid gap-3">
              {categories.map((category) => (
                <div
                  key={category}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-200"
                >
                  {category}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Values
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-[1.4rem] border border-zinc-200 bg-[#fbfcfa] p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="text-lg font-semibold tracking-tight">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Explore
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Discover the collection
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
            從日常護理到送禮靈感，慢慢挑選適合自己的手作產品。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/shop"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              前往選購
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
            >
              聯絡我們
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default About;
