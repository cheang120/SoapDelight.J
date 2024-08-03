import { useEffect, useState } from "react";
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";
import { sliderData } from "./slider-data";
// import "./Slider.scss";
import { useNavigate } from "react-router-dom";

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideLength = sliderData.length;
  //   console.log(slideLength);
  const navigate = useNavigate();

  const autoScroll = true;
  let slideInterval;
  let intervalTime = 5000;

  const nextSlide = () => {
    setCurrentSlide(currentSlide === slideLength - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? slideLength - 1 : currentSlide - 1);
  };

  useEffect(() => {
    setCurrentSlide(0);
  }, []);

  //   const auto = () => {
  //     slideInterval = setInterval(nextSlide, intervalTime);
  //   };

  useEffect(() => {
    if (autoScroll) {
      const auto = () => {
        slideInterval = setInterval(nextSlide, intervalTime);
      };
      auto();
    }
    return () => clearInterval(slideInterval);
  }, [currentSlide, slideInterval, autoScroll]);

  return (
<div className="w-full h-[90vh] relative overflow-hidden bg-dark">
  <AiOutlineArrowLeft className="absolute top-1/2 -translate-y-1/2 z-40 inline-flex items-center justify-center w-10 h-10 border-2 border-orangered hover:border-gray-400 rounded-full bg-transparent text-white hover:bg-transparent cursor-pointer hover:bg-white hover:text-gray-400 left-6 text-orangered" onClick={prevSlide} />
  <AiOutlineArrowRight className="absolute top-1/2 -translate-y-1/2 z-40 inline-flex items-center justify-center w-10 h-10 border-2 border-orangered hover:border-gray-400 rounded-full bg-transparent text-white hover:bg-transparent cursor-pointer hover:bg-white hover:text-gray-400 right-6 text-orangered" onClick={nextSlide} />
  {sliderData.map((slide, index) => {
    const { image, heading, desc } = slide;
    return (
      <div
        key={index}
        className={
          index === currentSlide
            ? "absolute top-0 left-0 w-full h-full opacity-100 translate-x-0 transition-all duration-500 ease-in-out z-10"
            : "absolute top-0 left-0 w-full h-full opacity-0 translate-x-1/2 transition-all duration-500 ease-in-out z-0"
        }
      >
        <img src={image} alt="slide" className="object-cover w-full h-full  sm:w-full sm:h-full" />
        {index === currentSlide && (
          <div className="text-white mb-4 absolute inset-0 flex items-center justify-center z-20">
            <div className="relative w-1/2 px-12 py-12 flex flex-col items-center bg-[rgba(0,0,0,0.4)] shadow-[0_20px_50px_rgb(23,32,90)] animation-slide-up animation-duration-[1s] animation-timing-function-ease animation-delay-[0.5s] animation-fill-mode-forwards box-border opacity-100">
              <span className="absolute top-0 left-0 w-[30%] h-[2px] bg-[#50dfdb] animate-span1"></span>
              <span className="absolute bottom-0 right-0 w-[30%] h-[2px] bg-[#50dfdb] animate-span2"></span>
              <h2 className="z-50 text-white mb-4 text-[2.5rem] sm:text-[3.5rem]">{heading}</h2>
              <p className="text-white mb-4">{desc}</p>
              <hr className="w-full mb-4" />
              <button className="text-[1.6rem] font-normal py-[6px] px-[8px] mr-[5px] border border-transparent rounded-[3px] cursor-pointer flex justify-center items-center transition-all duration-300 text-white bg-[#007bff]" onClick={() => navigate("/shop")}>
                Shop Now
              </button>
            </div>
          </div>
        )}
      </div>
    );
  })}
</div>
  );
};

export default Slider;
