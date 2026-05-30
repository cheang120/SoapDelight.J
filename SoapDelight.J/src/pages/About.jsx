import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const values = [
  {
    title: "小批量手作",
    description: "重視手作細節與小批量製作的質感，讓每件作品保留獨特溫度。",
  },
  {
    title: "生活選物",
    description: "從護理、香氣、陶瓷、家居擺設到禮品，整理適合日常與送禮的作品。",
  },
  {
    title: "自然靈感",
    description: "由植物、香氣、材質與生活節奏出發，保留舒服、溫和而自然的感覺。",
  },
  {
    title: "本地小店溫度",
    description: "來自澳門的小品牌，希望把安心、心意與手作細節帶到每一次使用和送禮。",
  },
];

const categories = [
  "手作護理",
  "手工皂",
  "香氣蠟燭",
  "陶瓷器物",
  "燈箱與家居擺設",
  "禮品選物",
];

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
                關於我們
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                關於 SoapDelight.J
              </h1>
              <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">
                關於 SoapDelight.J
              </p>
              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
                SoapDelight.J 是源自澳門的小型手作與生活選物品牌，整理手作護理、香氣蠟燭、陶瓷器物、燈箱家居擺設及禮品選物，重視日常使用感、手作溫度與送禮心意。
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
                      品牌價值
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
              品牌故事
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              以手作溫度整理日常與送禮選物。
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-600 dark:text-zinc-300">
              SoapDelight.J 以小批量手作與生活選物為核心，從手作護理、手工皂、香氣蠟燭，到陶瓷器物、燈箱與禮品選物，每一件都重視日常使用感、手作細節和送禮時的心意。希望這些作品不只是商品，也能為生活帶來一點溫柔、安心和溫度。
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-200 bg-[#f7f8f4] px-6 py-8 dark:border-zinc-800 dark:bg-zinc-900 sm:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              商品系列
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              我們整理的系列
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
            品牌價值
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
            探索
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            探索商品系列
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
            從日常護理、香氣、陶瓷器物到生活禮品，慢慢挑選適合自用或送禮的作品。
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
