import { useEffect, useState, useRef } from "react";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";
import { sliderData } from "./slider-data"; // 假設你的數據來源
import { useNavigate } from "react-router-dom";

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true); // 用於控制過渡效果
  const slideLength = sliderData.length; // 獲取幻燈片總數
  const navigate = useNavigate();
  const slideInterval = useRef(null);
  const intervalTime = 5000; // 自動播放時間間隔（毫秒）

  // 下一張幻燈片
  const nextSlide = () => {
    if (currentSlide === slideLength - 1) {
      // 如果是最後一張，刪除過渡效果並快速回到第一張
      setIsTransitioning(false);
      setCurrentSlide(0);
      setTimeout(() => setIsTransitioning(true), 20); // 等待瀏覽器重繪
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  // 上一張幻燈片
  const prevSlide = () => {
    if (currentSlide === 0) {
      // 如果是第一張，刪除過渡效果並快速回到最後一張
      setIsTransitioning(false);
      setCurrentSlide(slideLength - 1);
      setTimeout(() => setIsTransitioning(true), 20); // 等待瀏覽器重繪
    } else {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  // 開始自動播放
  const startAutoScroll = () => {
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev === slideLength - 1 ? 0 : prev + 1)); // 循環播放
    }, intervalTime);
  };

  // 停止自動播放
  const stopAutoScroll = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
  };

  useEffect(() => {
    setCurrentSlide(0); // 從第一張幻燈片開始
  }, []);

  useEffect(() => {
    startAutoScroll(); // 啟動自動播放
    return () => stopAutoScroll(); // 組件卸載時清除 interval
  }, []);

  useEffect(() => {
    stopAutoScroll(); // 停止自動播放
    startAutoScroll(); // 重新啟動自動播放
  }, [currentSlide]);

  // const currentPath = sliderData[currentSlide]?.path;

  return (
<div className="relative w-full overflow-hidden bg-dark">
  {/* 左箭頭按鈕 */}
  <AiOutlineArrowLeft
    className="absolute top-1/2 left-4 transform -translate-y-1/2 text-3xl cursor-pointer z-10 text-white border-2 border-purple-400 rounded-full bg-transparent hover:bg-white hover:text-purple-600"
    onClick={prevSlide}
  />
  {/* 右箭頭按鈕 */}
  <AiOutlineArrowRight
    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-3xl cursor-pointer z-10 text-white border-2 border-purple-400 rounded-full bg-transparent hover:bg-white hover:text-purple-600"
    onClick={nextSlide}
  />

  {/* 滑動圖片容器 */}
  <div
    className={`flex ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
  >
    {sliderData.map((slide, index) => {
      const { image, heading, desc, path } = slide;
      return (
        <div key={index} className="relative min-w-full max-h-[40rem] md:max-h-[70rem]">
          <div className="aspect-w-4 aspect-h-3">
            <img src={image} alt={`${index}`} className="object-cover w-full h-full" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white  p-6 md:p-8 lg:p-12 transition-transform duration-1000 ease-in-out shadow-lg">
            <div className="z-40 flex flex-col items-center text-center space-y-4 max-w-lg bg-black bg-opacity-40">
              <div className="flex flex-col items-center justify-center relative px-20 py-8  ">
                <span className="absolute top-0 left-0 w-full h-full"></span>
                <span className="absolute top-0 left-0 w-[30%] h-[2px] bg-yellow-400 animate-span1"></span>
                <span className="absolute bottom-0 right-0 w-[30%] h-[2px] bg-yellow-400 animate-span2"></span>
                <span className="absolute top-0 left-0 w-[2px] h-[30%] bg-yellow-400 animate-span3"></span>
                <span className="absolute bottom-0 right-0 w-[2px] h-[30%] bg-yellow-400 animate-span4"></span>
                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-4">{heading}</h2>
                <p className="text-sm md:text-lg lg:text-xl mb-4">{desc}</p>
                <hr className="h-px bg-white w-16 my-4" />
                <button
                  className="z-40 px-4 py-2 text-sm md:px-6 md:py-3 md:text-basefocus:outline-none bg-gradient-to-r from-purple-500 to-pink-500 text-white focus:ring-4 focus:ring-purple-200 enabled:hover:bg-gradient-to-l dark:focus:ring-purple-800 rounded-md "
                  onClick={() => navigate(path)}
                >
                  立即選購
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>

  );
};

export default Slider;
