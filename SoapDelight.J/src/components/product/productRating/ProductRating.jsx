import React from "react";
import StarRatings from "react-star-ratings";

const ProductRating = ({ averageRating, noOfRatings }) => {
  return (
    <>
      {averageRating > 0 && (
        <div className="flex gap-2">
          <StarRatings
            starDimension="20px"
            starSpacing="2px"
            starRatedColor="#F6B01E"
            rating={averageRating}
            editing={false}
          />
          <div>
          ({noOfRatings})
          </div>
          
        </div>
      )}
    </>
  );
};

export default ProductRating;