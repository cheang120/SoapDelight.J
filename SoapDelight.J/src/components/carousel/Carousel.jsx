import React from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import "./Carousel.scss";
import { responsive } from "./data";
import ErrorBoundary from "./ErrorBoundary";

const ProductCarousel = ({ products }) => {
  return (
    <ErrorBoundary>
    <div>
      <Carousel
        showDots={false}
        responsive={responsive}
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={3000}
        customTransition="all 500ms ease"
        transitionDuration={1000}
        // key={item.id || index}
      >
        {products}
      </Carousel>
    </div>
    </ErrorBoundary>

  );
};

export default ProductCarousel;