import { toast } from "react-toastify";
import { BsTrash } from "react-icons/bs";
import StarRating from "react-star-ratings";
import { FaEdit } from "react-icons/fa";
import Card from "../../components/card/Card";
// import { Spinner } from "../../components/loader/Loader";
import { useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import "./ReviewProducts.module.scss";
import { getProduct } from "../../redux/features/product/productSlice";

const ReviewProduct = () => {
    const { id } = useParams();
    const [rate, setRate] = useState(0);
    const [review, setReview] = useState("");
    const [userReview, setUserReview] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
  
    const { isLoading, product } = useSelector(
      (state) => state.product
    );
    const { user } = useSelector((state) => state.auth);
  
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(getProduct(id));
      }, [dispatch, id]);
      console.log(product);

  return (
    <div>
      ReviewProduct
    </div>
  )
}

export default ReviewProduct
