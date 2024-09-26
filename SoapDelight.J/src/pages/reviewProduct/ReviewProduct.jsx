import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { deleteReview, getProduct, reviewProduct, updateReview } from "../../redux/features/product/productSlice";
import { toast } from "react-toastify";
import { BsTrash } from "react-icons/bs";
import StarRating from "react-star-ratings";
import { FaEdit } from "react-icons/fa";
import { Spinner } from "../../components/Loader";

const ReviewProducts = () => {
  const { id } = useParams();
  const [rate, setRate] = useState(0);
  const [review, setReview] = useState("");
  const [userReview, setUserReview] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const { isLoading, product } = useSelector((state) => state.product);
  const { currentUser } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getProduct(id));
    window.scrollTo(0, 0);
  }, [dispatch, id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (rate === 0 || review === "") {
      return toast.error("Please enter rating and review");
    }

    const today = new Date();
    const date = today.toDateString();

    const formData = {
      star: rate,
      review,
      reviewDate: date,
    };

    await dispatch(reviewProduct({ id, formData }));
    navigate(-1);
  };

  const delReview = async () => {
    const formData = {
      userID: currentUser._id,
    };
    await dispatch(deleteReview({ id, formData }));
    navigate(-1);
  };

  const startEdit = () => {
    setIsEditing(true);
    setRate(userReview[0].star);
    setReview(userReview[0].review);
  };

  const editReview = async (e) => {
    e.preventDefault();
    if (rate === 0 || review === "") {
      return toast.error("Please enter rating and review");
    }

    const today = new Date();
    const date = today.toDateString();

    const formData = {
      star: rate,
      review,
      reviewDate: date,
      userID: userReview[0].userID,
    };

    await dispatch(updateReview({ id, formData }));
    navigate(-1);
  };

  useEffect(() => {
    const reviewed = product?.ratings?.filter((rev) => rev.userID === currentUser?._id);
    setUserReview(reviewed);
  }, [product, currentUser]);

  const changeStar = (newRating) => {
    setRate(newRating);
  };

  return (
    <section className="py-8 px-4 md:px-8 lg:px-16 min-h-[70rem]">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-6">Review Products</h2>
        {isLoading && product === null ? (
          <Spinner />
        ) : (
          <>
            <p className="text-lg mb-4">
              <b>Product name:</b> {product?.name}
            </p>
            <img
              src={product?.image[0]}
              alt={product?.name}
              className="w-24 h-24 object-cover mb-6"
            />
          </>
        )}
        {userReview?.length > 0 && !isEditing ? (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Your Review</h3>
            {userReview.map((item, index) => {
              const { star, review, reviewDate, name } = item;
              return (
                <div key={index} className="flex justify-between items-center mb-4">
                  <div>
                    <StarRating
                      starDimension="20px"
                      starSpacing="2px"
                      starRatedColor="#F6B01E"
                      rating={star}
                      editing={false}
                    />
                    <p className="mt-2 text-gray-700">{review}</p>
                    <span className="block text-sm text-gray-500">
                      <b>{reviewDate}</b>
                    </span>
                    <span className="block text-sm text-gray-500">
                      <b>by: {name}</b>
                    </span>
                  </div>
                  <div className="flex space-x-4">
                    <FaEdit
                      className="cursor-pointer text-green-500 hover:text-green-600"
                      size={25}
                      onClick={startEdit}
                    />
                    <BsTrash
                      className="cursor-pointer text-red-500 hover:text-red-600"
                      size={25}
                      onClick={delReview}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 w-full md:w-1/2 mx-auto">
            <form>
              <label className="block text-lg font-medium mb-2">Rating:</label>
              <StarRating
                starDimension="25px"
                starSpacing="4px"
                starRatedColor="#F6B01E"
                starHoverColor="#F6B01E"
                rating={rate}
                changeRating={changeStar}
                editing={true}
                isSelectable={true}
                className="mb-4"
              />
              <label className="block text-lg font-medium mb-2">Review</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full p-4 rounded-md border-gray-300 mb-4"
                rows="6"
                placeholder="Write your review here..."
              ></textarea>
              <div className="flex space-x-4">
                {!isEditing ? (
                  <button
                    onClick={submitReview}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Submit Review
                  </button>
                ) : (
                  <>
                    <button
                      onClick={editReview}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Update Review
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewProducts;
