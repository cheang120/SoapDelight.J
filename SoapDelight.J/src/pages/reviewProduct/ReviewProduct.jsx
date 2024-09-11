import { toast } from "react-toastify";
import { BsTrash } from "react-icons/bs";
import StarRating from "react-star-ratings";
import { FaEdit } from "react-icons/fa";
import Card from "../../components/card/Card";
import styles from "./ReviewProducts.module.scss"
// import { Spinner } from "../../components/loader/Loader";
import { useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import "./ReviewProducts.module.scss";
import { deleteReview, getProduct, reviewProduct } from "../../redux/features/product/productSlice";
import { Spinner } from "../../components/Loader";
import axios from 'axios';  // Add this line


const ReviewProduct = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const [rate, setRate] = useState(0);
    const [review, setReview] = useState("");
    const [userReview, setUserReview] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
  
    const { isLoading, product } = useSelector(
      (state) => state.product
    );
    const { username } = useSelector((state) => state.auth);
        
    useEffect(() => {
        dispatch(getProduct(id));
      }, [dispatch, id]);
    // console.log(product);

    const submitReview = async (e) => {
        e.preventDefault();
        const today = new Date();
        const date = today.toDateString();
        if (rate === 0 || review === "") {
          return toast.error("Please enter rating and review");
        }
        const formData = {
          star: rate,
          review,
          reviewDate: date,
        };
        // console.log(formData);
        await dispatch(reviewProduct({ id, formData }));
        navigate(-1);
    };
    

    const startEdit = async () => {
        setIsEditing(true);
        setRate(userReview[0].star);
        setReview(userReview[0].review);
      };
    const editReview = async (e) => {
        e.preventDefault();
        const today = new Date();
        const date = today.toDateString();
        if (rate === 0 || review === "") {
          return toast.error("Please enter rating and review");
        }
    const formData = {
          star: rate,
          review,
          reviewDate: date,
          username:username,
          userID: userReview[0].userID,
        };
        // console.log(formData);
        await dispatch(updateReview({ id, formData }));
        navigate(-1);
      };

      // console.log(product?.ratings);
    useEffect(() => {
        console.log(product.ratings);
        const reviewed = product?.ratings.filter((rev) => {
          return rev.userID
        });
        // console.log(rev.userID);
        setUserReview(reviewed);
        // console.log(userReview.length);
    }, [product, username]);
    
    const changeStar = (newRating, user) => {
        setRate(newRating);

      };

      const delReview = async (userID) => {
        // console.log(user);
        const formData = {
          userID: userID, // 傳遞評論的用戶ID
        };
        console.log(id); // 驗證產品ID是否正確

        await dispatch(deleteReview({ id, formData })); // 發送刪除評論的請求
        navigate(-1); // 返回上一頁
    };


  return (
    <section>
        <div className="container review">
            <h2 className="text-2xl p-5">Review Products</h2>
            {isLoading && product === null ? (
                <Spinner />
            ) : (
                <div className="p-5">
                    <p>
                        <b>Product name:</b> {product?.name}
                    </p>
                    <img src={product?.image[0]} alt="product" style={{width:"100px"}} />
                </div>
            )}
            {userReview?.length > 0 && !isEditing ? (
              <div className="my-5">
                <Card cardClass={"card"}>
                  <div className="p-5">
                    <h3>Product Reviews</h3>
                    <div>
                    {userReview.map((item, index) => {
                      const { star, review, reviewDate, name, userID } = item;
                      return (
                        <div key={index} className="review --flex-between">
                          <div className="my-5">
                            {/* <StarsRating value={rate} /> */}
                            <StarRating
                              starDimension="20px"
                              starSpacing="2px"
                              starRatedColor="#F6B01E"
                              rating={star}
                              changeRating={changeStar}
                              editing={false}
                            />
                            <p>{review}</p>
                            <span>
                              <b>{reviewDate}</b>
                            </span>
                            <br />
                            <span>
                              <b>by: {name}</b>
                            </span>
                          </div>
                          <div className="flex">
                            <FaEdit
                              color="green"
                              size={25}
                              onClick={() => startEdit()}
                            />
                            <BsTrash color="red" size={25} onClick={() => delReview(userID)} />
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                    
                </Card>
              </div>

            ) : (
                <Card cardClass={"card --width-500px --p"}>
                    <form style={{width:"500px"}}>
                        <label htmlFor="">
                            Star Rating 
                        </label>
                        <StarRating 
                            starDimension="20px"
                            starSpacing="2px"
                            starRatedColor="#F6B01E"
                            starHoverColor="#F6B01E"
                            rating={rate}
                            changeRating={changeStar}
                            editing={true}
                            isSelectable={true}
                        />
                        <label htmlFor="">Review</label>
                        <textarea
                            value={review}
                            required
                            onChange={(e) => setReview(e.target.value)}
                            cols="30"
                            rows="10"
                        ></textarea>
                        {!isEditing ? (
                            <button
                            onClick={(e) => submitReview(e)}
                            className="--btn --btn-primary"
                          >
                            Submit Review
                          </button>
                        ) : (
                            <div className="--flex-start">
                            <button
                                onClick={(e) => editReview(e)}
                                className="--btn --btn-primary"
                            >
                                Update Review
                            </button>
                            <button onClick={() => setIsEditing(false)} className="--btn">
                                Cancel
                            </button>
                            </div>
                        )}
                    </form>
                </Card>
            )}
        </div>
    </section>
  )
}

export default ReviewProduct
