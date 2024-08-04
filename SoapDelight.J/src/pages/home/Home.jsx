import React from 'react'
import { Avatar, Button, Dropdown, Navbar, TextInput } from 'flowbite-react';

import "./Home.scss";
import HomeInfoBox from "./HomeInfoBox";

import Slider from '../../components/slider/slider.jsx'

const PageHeading = ({ heading, btnText }) => {
  return (
    <>
      <div className="--flex-between">
        <h2 className="--fw-thin">{heading}</h2>
        <Button               
          gradientDuoTone='purpleToPink'
          className="text-[1rem] mb-2  font-normal  px-2 mr-1  border border-transparent rounded-md cursor-pointer flex justify-center items-center transition-all duration-300"
        >
          {btnText}
        </Button>
      </div>
      <div className="--hr" />
    </>
  );
};

const Home = () => {
  return (
    <div className='flex flex-col'>
      <Slider />
      <section className=''>
        <div className="max-w-[1000px] mx-auto px-5">
          <HomeInfoBox />
          <PageHeading heading={"Latest Products"} btnText={"Shop Now >>>"} />
          {/* <ProductCarousel products={latestProducts} /> */}
        </div>
      </section>
    </div>
  )
}

export default Home
