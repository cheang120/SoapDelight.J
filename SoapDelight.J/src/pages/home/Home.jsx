import React, { useEffect } from 'react'
import { Avatar, Button, Dropdown, Navbar, TextInput } from 'flowbite-react';
import { productData } from "../../components/carousel/data.jsx";
import CarouselItem from "../../components/carousel/CarouselItem";

import "./Home.scss";
import HomeInfoBox from "./HomeInfoBox";

import Slider from '../../components/slider/slider.jsx'
import ProductCarousel from '../../components/carousel/Carousel.jsx';
import ProductCategory from '../../components/productCategory/ProductCategory.jsx';
import { useDispatch, useSelector } from 'react-redux';
import {
  getProducts,
  // selectProducts,
} from "../../redux/features/product/productSlice.jsx";
import { Navigate, useNavigate } from 'react-router-dom';


const PageHeading = ({ heading, btnText }) => {
  const navigate = useNavigate();
  return (
    <>
      <div className="--flex-between">
        <h2 className="--fw-thin">{heading}</h2>
        <Button               
          gradientDuoTone='purpleToPink'
          className="text-[1rem] mb-2  font-normal  mr-1  border border-transparent rounded-md cursor-pointer flex justify-center items-center transition-all duration-300"
          onClick={() => navigate("/shop")}
        >
          {btnText}
        </Button>
      </div>
      <div className="--hr" />
    </>
  );
};
// const latestProducts = [
//   <div key="1">产品 1</div>,
//   <div key="2">产品 2</div>,
//   <div key="3">产品 3</div>,
// ];


// const latestProducts = latest.map((item) => (
//   <div key={item._id}>
//     <CarouselItem
//       name={item.name}
//       url={item.image[0]}
//       price={item.price}
//       regularPrice={item.regularPrice}
//       description={item.description}
//       product={item}
//     />
//   </div>
// ));

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    dispatch(getProducts());
    window.scrollTo(0, 0);
  }, [dispatch]);
  const { products } = useSelector((state) => state.product);
  // const latest = products
  //   ?.filter((product, index) => {
  //     return product.quantity > 0;
  //   })
  //   ?.filter((product, index) => index < 6);
  const latest = products
  ?.filter((product) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);  // 設定為一個月前
    const productDate = new Date(product.createdAt);  // 假設 'createdAt' 是產品的上架日期
    // 排除 shipping 類別的產品
    return product.quantity > 0 && productDate >= oneMonthAgo && product.category !== "Shipping";
  })
  ?.slice(0, 6);  // 只取前6個

  const phones = products
    ?.filter((product) => {
      return product.quantity > 0
    })
    ?.filter((product, index) => {
      return product.category === "Phone";
    })
    ?.filter((product, index) => index < 6);

  const soaps = products
    ?.filter((product) => {
      return product.quantity > 0
    })
    ?.filter((product, index) => {
      return product.category === "Soap";
    })
    ?.filter((product, index) => index < 6);

    const personalCare = products
    ?.filter((product) => {
      return product.quantity > 0
    })
    ?.filter((product, index) => {
      return product.category === "Personal Care";
    })
    ?.filter((product, index) => index < 6);

    const candle = products
    ?.filter((product) => {
      return product.quantity > 0
    })
    ?.filter((product, index) => {
      return product.category === "香薰蠟";
    })
    ?.filter((product, index) => index < 6);

    const shipping = products
    ?.filter((product) => {
      return product.quantity > 0
    })
    ?.filter((product, index) => {
      return product.category === "Shipping";
    })
    ?.filter((product, index) => index < 6);

    const latestProducts = latest.map((item)=>(
      <div key={item.id}>
        <CarouselItem 
          name={item.name}
          url={item.image[0]}
          price={item.price}
          regularPrice={item.regularPrice}
          description={item.description}
          product={item}
        />
      </div>
    ))

    const phoneProducts = phones.map((item)=>(
      <div key={item.id}>
        <CarouselItem 
          name={item.name}
          url={item.image[0]}
          price={item.price}
          regularPrice={item.regularPrice}
          description={item.description}
          product={item}
        />
      </div>
    ))

    const soapProducts = soaps.map((item)=>(
      <div key={item.id}>
        <CarouselItem 
          name={item.name}
          url={item.image[0]}
          price={item.price}
          regularPrice={item.regularPrice}
          description={item.description}
          product={item}
        />
      </div>
    ))

    const personalCareProducts = personalCare.map((item)=>(
      <div key={item.id}>
        <CarouselItem 
          name={item.name}
          url={item.image[0]}
          price={item.price}
          regularPrice={item.regularPrice}
          description={item.description}
          product={item}
        />
      </div>
    ))

    const candleProducts = candle.map((item)=>(
      <div key={item.id}>
        <CarouselItem 
          name={item.name}
          url={item.image[0]}
          price={item.price}
          regularPrice={item.regularPrice}
          description={item.description}
          product={item}
        />
      </div>
    ))

    const shippingProducts = shipping.map((item)=>(
      <div key={item.id}>
        <CarouselItem 
          name={item.name}
          url={item.image[0]}
          price={item.price}
          regularPrice={item.regularPrice}
          description={item.description}
          product={item}
        />
      </div>
    ))

    // const productss = productData.map((item)=>(
    //   <div key={item.id}>
    //     <CarouselItem 
    //       name={item.name}
    //       url={item.imageurl}
    //       price={item.price}
    //       description={item.description}
    //     />
    //   </div>
    // ))

  return (
    <div className='flex flex-col'>
      <Slider />

      <section className=''>
        <div className="max-w-[1000px] mx-auto px-5">
          <HomeInfoBox />
          <PageHeading heading={"最新產品"} btnText={"立即選購 >>>"}  />
          <ProductCarousel products={latestProducts}  />
        </div>
      </section>
      {/* <section className='bg-gray-100 dark:bg-gray-800 py-8'>
        <div className="max-w-[1000px] mx-auto px-5">
          <h3 className='text-2xl my-5'>Categories</h3>
          <ProductCategory />
        </div>
      </section> */}
      <section className=''>
        <div className="max-w-[1000px] mx-auto px-5 pt-5">
          <PageHeading heading={"個人護理"} btnText={"立即選購 >>>"} />
          <ProductCarousel products={personalCareProducts}  />
        </div>
      </section>
      <section className=''>
        <div className="max-w-[1000px] mx-auto px-5 pt-5">
          <PageHeading heading={"手作皂"} btnText={"立即選購 >>>"} />
          <ProductCarousel products={soapProducts}  />
        </div>
      </section>
      <section className=''>
        <div className="max-w-[1000px] mx-auto px-5 pt-5">
          <PageHeading heading={"香薰蠟"} btnText={"立即選購 >>>"} />
          <ProductCarousel products={candleProducts}  />
        </div>
      </section>
      {/* <div class="fixed bottom-4 right-4 md:bottom-6 md:right-6">
        <a href="https://wa.me/85366157169?text=Hello" target="_blank">
          <button class="bg-green-500 hover:bg-green-600 text-white font-bold p-3 rounded-full flex items-center justify-center w-12 h-12 md:w-16 md:h-16">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp Logo" class="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </a>
      </div> */}
    </div>
  )
}

export default Home
