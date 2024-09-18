import React, { useState, useEffect } from "react";
import { BsCartCheck, BsFillCreditCardFill } from "react-icons/bs";
import { FaTruck } from "react-icons/fa";


// 模擬的資料
const data = [
  {
    icon: <BsFillCreditCardFill size={30} color="#f7d272" />,
    heading: "付款及退款政策",
    modalContent: (
      <>
        <h3 className="text-xl font-semibold mb-6">付款方式及政策</h3>
        <ol className="list-decimal list-inside space-y-4 text-lg">
          <li>當訂單確認並完成付款後，將不接受任何退款或修改請求；</li>
          <li>手工皂會在收到款項後的7天內發貨；</li>
          <li>護膚產品為即訂即製，收到款項後約需7-10天製作完成並寄出；</li>
          <li>護膚產品的容器須經過多次消毒程序，且製作過程耗時，請耐心等待；</li>
          <li>每個人的過敏源各不相同，建議在使用產品前先進行耳後過敏測試；</li>
          <li>所有訂單在確認並付款後，將無法進行退款或更改；</li>
          <li>為避免訂單混亂，若在等待發貨期間需要追加產品，請另行下單，無法合併發貨；</li>
          <li>運費優惠僅適用於單筆訂單，購物滿指定金額可享免運服務，計算方式以每張訂單為準。</li>
        </ol>
        <div className="mt-6">
          <h4 className="text-lg font-semibold">我們接受的付款方式：</h4>
          <div className="flex space-x-4 mt-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
              alt="Visa"
              className="w-16"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
              alt="Mastercard"
              className="w-16"
            />
          </div>
        </div>
      </>
    ),
  },
  {
    icon: <FaTruck size={30} color="#fa82ea" />,
    heading: "送貨方式",
    modalContent: (
      <>
        <h3 className="text-xl font-semibold mb-6">送貨方式</h3>
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold">香港 本地送貨</h4>
            <p className="text-lg">+HKD 0.00</p>
            <p className="text-lg">📦 順豐快遞 - 💲購物滿$400免運費，購物$400以下順豐到付方式寄出。</p>
            <p className="text-lg">✔️ 可寄到指定住宅、工商地址、順豐站、智能櫃。</p>
            <p className="text-lg">❤️ 一般出貨日期大概7至10日。</p>
            <p className="text-lg">
              🌟 為免造成訂單混亂，下單後不設更改或後加合併夾單岀貨安排，免運費計算方法以每張訂單計算。
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold">國際送貨</h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-md font-semibold">澳門 空郵掛號</h5>
                <p className="text-lg">+HKD 50.00</p>
                <p className="text-lg">🌟 請輸入身份證明文件上全名，收件時郵局職員會核對身份證。</p>
              </div>

              <div>
                <h5 className="text-md font-semibold">中國 大陸空郵掛號 (不能寄液體)</h5>
                <p className="text-lg">+HKD 80.00</p>
                <p className="text-lg">🌟 請輸入身份證明文件上全名，收件時郵局職員會核對身份證。</p>
              </div>

              <div>
                <h5 className="text-md font-semibold">台灣 空郵掛號 (不能寄液體)</h5>
                <p className="text-lg">+HKD 180.00</p>
                <p className="text-lg">🌟 請輸入身份證明文件上全名，收件時郵局職員會核對身份證。</p>
              </div>

              <div>
                <h5 className="text-md font-semibold">新加坡 空郵掛號 (不能寄液體)</h5>
                <p className="text-lg">+HKD 219.00</p>
                <p className="text-lg">🌟 請輸入身份證明文件上英文全名，收件時郵局職員會核對身份證。</p>
              </div>

              <div>
                <h5 className="text-md font-semibold">加拿大 空郵掛號 (不能寄液體)</h5>
                <p className="text-lg">+HKD 339.00</p>
                <p className="text-lg">🌟 請輸入身份證明文件上英文全名，收件時郵局職員會核對身份證。</p>
              </div>
            </div>
          </div>
        </div>
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
      <div className="icon flex justify-center items-center h-16  mx-auto">
        {item.icon}
      </div>
      <div className="text flex justify-center items-center h-16  mx-auto">
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
            } max-h-[80vh] overflow-y-auto`}
          >
            {activeItem.modalContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeInfoBox;
