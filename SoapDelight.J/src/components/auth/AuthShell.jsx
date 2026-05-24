import { Link } from "react-router-dom";

export const authInputClassName =
  "block min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800";

export const authLabelClassName =
  "mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-200";

export const authPrimaryButtonClassName =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200";

export const authSecondaryButtonClassName =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800";

export const authInlineLinkClassName =
  "text-sm font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300";

export const authFooterRowClassName =
  "mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400";

const brandParagraphs = [
  "SoapDelight.J 為您帶來全新的澳門品牌，致力於提供品質天然的手工護膚品及手工皂。我們的產品以天然植物草本為基礎，避免使用人工合成的有害防腐劑和矽油等成分。",
  "我們的手工皂和護膚品經過精心製作，不僅能夠潔淨肌膚，還能提供滋養和保護，讓您的肌膚煥發健康光彩。品牌故事源於一位媽媽對小朋友的愛與關懷，希望為孩子帶來更天然的護膚體驗。",
  "選擇 SoapDelight.J，您將獲得更溫柔、安心的護膚體驗。我們相信天然是最好的選擇，也希望每一次使用都能讓肌膚感受到植物與手作的美好。",
];

const AuthShell = ({ eyebrow, title, subtitle, children, footer }) => {
  return (
    <main className="min-h-screen bg-[#fbfcfa] px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <section className="border-b border-zinc-200 bg-[#f5f7f4] px-6 py-10 dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-8 sm:py-12 lg:border-b-0 lg:border-r lg:px-10 lg:py-14">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="rounded-2xl bg-zinc-950 px-4 py-2 text-lg font-semibold tracking-tight text-white dark:bg-white dark:text-zinc-950 sm:px-5 sm:py-3 sm:text-2xl">
                  SoapDelight.J
                </span>
              </Link>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
                    Natural Handmade Care
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    溫柔、天然、手作日常
                  </h2>
                </div>

                <div className="space-y-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base">
                  {brandParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-6 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
              <div className="mx-auto max-w-xl">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400">
                  {eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300 sm:text-base">
                    {subtitle}
                  </p>
                ) : null}

                <div className="mt-8">{children}</div>
                {footer ? <div className={authFooterRowClassName}>{footer}</div> : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthShell;
