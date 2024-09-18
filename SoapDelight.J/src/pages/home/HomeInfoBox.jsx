import React, { useState, useEffect } from "react";
import { BsCartCheck, BsFillCreditCardFill } from "react-icons/bs";

// 模擬的資料
const data = [
  {
    icon: <BsFillCreditCardFill size={30} color="#f7d272" />,
    heading: "付款政策",
    modalContent: (
      <>
        <h3 className="text-xl font-semibold mb-6">付款方式及政策</h3>
        <ol className="list-decimal list-inside space-y-4 text-lg">
          <li>所有訂單一經確認及付款後，不設退款或更改</li>
          <li>手工皂會於收妥款項後7日內寄出</li>
          <li>護膚品為即訂即製，會喺收妥款項後大概7-10日內製成並寄岀</li>
          <li>護膚品容器需經多重消毒程序，而且製作過程需時，請耐心等候</li>
          <li>每人致敏源都不同，使用產品前請先進行耳背敏感測試</li>
          <li>所有訂單一經確認及付款後，不設退款或更改</li>
          <li>為免造成訂單混亂，如於等候出貨期間需要加購產品，請到網店另下新訂單，不設合併發貨服務</li>
          <li>購物滿指定金額免運費之計算以每張訂單獨立計算</li>
        </ol>
      </>
    ),
  },
  {
    icon: <BsCartCheck size={30} color="#fa82ea" />,
    heading: "Quality Products",
    modalContent: (
      <>
        <h3 className="text-xl font-semibold mb-6">香港 本地送貨</h3>
        <p className="text-lg">📦 順豐快遞 - 💲購物滿$400免運費，購物$400以下順豐到付方式寄出。</p>
        <p className="text-lg">✔️ 可寄到指定住宅、工商地址、順豐站、智能櫃。</p>
        <p className="text-lg">❤️ 一般出貨日期大概7至10日。</p>
        <p className="text-lg">
          🌟 為免造成訂單混亂，下單後不設更改或後加合併夾單岀貨安排，免運費計算方法以每張訂單計算。
        </p>
      </>
    ),
  },
];

const HomeInfoBox = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleModalOpen = (item) => {
    setActiveItem(item);
    setIsModalOpen(true);
    setTimeout(() => {
      setIsAnimating(true);
    }, 50); // 更快的動畫開始時間
  };

  const handleModalClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setActiveItem(null);
    }, 250); // 與動畫時間同步
  };

  // 點擊模態框外部關閉模態框
  useEffect(() => {
    if (isModalOpen) {
      const handleOutsideClick = (event) => {
        if (event.target.classList.contains("modal-background")) {
          handleModalClose();
        }
      };
      window.addEventListener("click", handleOutsideClick);

      return () => {
        window.removeEventListener("click", handleOutsideClick);
      };
    }
  }, [isModalOpen]);

  return (
    <div className="infoboxes mb-8 mt-8 justify-evenly">
      {data.map((item, index) => (
        <div
          className="infobox my-4 cursor-pointer"
          key={index}
          onClick={() => handleModalOpen(item)}
        >
          <div className="icon">{item.icon}</div>
          <div className="text">
            <h4>{item.heading}</h4>
          </div>
        </div>
      ))}

      {isModalOpen && activeItem && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 modal-background bg-black bg-opacity-50 transition-opacity duration-300 ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`bg-white p-8 rounded-lg shadow-lg w-4/5 max-w-4xl transform transition-transform duration-300 ${
              isAnimating ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            {activeItem.modalContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeInfoBox;
