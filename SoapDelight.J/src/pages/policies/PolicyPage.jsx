import React, { useEffect } from "react";

export const policyPages = {
  refundReturn: {
    title: "退款及退貨政策",
    lastUpdated: "2026年6月",
    sections: [
      {
        heading: "退款及退貨申請",
        paragraphs: [
          "客人收到商品後如發現破損、錯漏或其他問題，應盡快聯絡 SoapDelight.J，並提供訂單資料及相關情況，方便我們跟進。",
          "商品如已寄出或已送達，需先由店方確認退貨情況，才安排退款、更換或其他合適處理。",
        ],
      },
      {
        heading: "退款安排與庫存處理",
        bullets: [
          "如商品可重新上架，店方可按情況補回庫存及處理退款。",
          "如商品不可重新上架，店方會根據個案判斷是否退款、部分退款或不設退款。",
          "如個案不符合退款安排，店方可結案並不設退款。",
          "所有退款及退貨安排以店方最終確認為準。",
        ],
      },
      {
        heading: "費用與時間",
        bullets: [
          "如因客人個人原因退貨，支付平台手續費、送貨費、退回運費或其他合理成本，可能會從退款中扣除。",
          "實際退款時間視 Stripe、銀行或支付平台處理時間而定。",
        ],
      },
    ],
  },
  deliveryPickup: {
    title: "送貨及自取政策",
    lastUpdated: "2026年6月",
    sections: [
      {
        heading: "送貨及自取安排",
        paragraphs: [
          "SoapDelight.J 會按客人訂單所選方式安排送貨或自取，並以訂單資料及後續確認為準。",
          "部分商品為手作或需整理，處理時間可能因產品狀況、製作安排或包裝需要而有所不同。",
        ],
      },
      {
        heading: "客人資料與交收責任",
        bullets: [
          "客人需提供正確聯絡方式及地址，確保送貨或自取安排可以順利進行。",
          "如地址錯誤、無人收件或客人未能配合交收，額外運費或重新安排費用可能由客人承擔。",
          "自取安排需按店方確認時間及地點進行。",
        ],
      },
      {
        heading: "時間與例外情況",
        bullets: [
          "特別天氣、公共假期或不可抗力情況可能影響送貨或交收時間。",
          "店方會盡力協調，但不承諾特定到達時間。",
        ],
      },
    ],
  },
  privacy: {
    title: "私隱政策",
    lastUpdated: "2026年6月",
    sections: [
      {
        heading: "資料收集範圍",
        bullets: [
          "SoapDelight.J 只收集處理訂單、付款、送貨、客戶服務及推廣訂閱所需資料。",
          "可能收集姓名、電話、電郵、送貨地址、訂單紀錄及付款狀態。",
        ],
      },
      {
        heading: "付款與第三方服務",
        bullets: [
          "Stripe 等付款資料由支付平台處理，SoapDelight.J 不儲存完整信用卡資料。",
          "客戶資料不會出售予第三方。",
        ],
      },
      {
        heading: "資料用途與保障",
        bullets: [
          "資料可能用於訂單處理、售後服務、退款退貨、電郵通知、推廣訂閱或法律/營運需要。",
          "客人可聯絡 SoapDelight.J 要求查詢、更正或刪除合理範圍內的個人資料。",
          "系統會盡合理方式保護資料安全，但網絡傳輸不可能保證百分百安全。",
        ],
      },
    ],
  },
  terms: {
    title: "條款及細則",
    lastUpdated: "2026年6月",
    sections: [
      {
        heading: "使用網站與下單",
        bullets: [
          "使用本網站及下單即表示同意相關條款及政策。",
          "訂單需成功付款後才會處理。",
          "客人有責任提供正確資料。",
        ],
      },
      {
        heading: "商品與訂單處理",
        bullets: [
          "商品圖片、描述、價格及庫存可能會更新。",
          "手作產品可能存在輕微差異，屬正常情況。",
          "SoapDelight.J 可因缺貨、系統錯誤、付款問題或其他合理原因取消訂單並安排相應處理。",
        ],
      },
      {
        heading: "網站使用規範",
        bullets: [
          "不得濫用網站、惡意下單或作非法用途。",
          "SoapDelight.J 保留更新政策及條款的權利。",
        ],
      },
    ],
  },
};

const PolicyPage = ({ title, lastUpdated, sections }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfcfa] px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-zinc-200 bg-white px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8 lg:px-10">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-700">
            政策資料
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            最後更新：{lastUpdated}
          </p>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
            以下內容適用於 SoapDelight.J 網站訂單、付款、送貨、自取及相關服務安排，方便客人隨時查閱。
          </p>
        </section>

        <section className="space-y-5">
          {sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-7 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8"
            >
              <h2 className="text-2xl font-semibold tracking-tight">
                {section.heading}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-300"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets?.length ? (
                <ul className="mt-4 space-y-3 text-base leading-8 text-zinc-600 dark:text-zinc-300">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-3 h-2 w-2 flex-none rounded-full bg-emerald-700" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default PolicyPage;
