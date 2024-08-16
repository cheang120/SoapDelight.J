import React, { useEffect } from 'react'
import {useDispatch, useSelector} from 'react-redux'
import { getProducts } from '../../../redux/features/product/productSlice'
import { selectIsLoggedIn } from '../../../redux/features/auth/authSlice'

const ViewProducts = () => {
  const { currentUser } = useSelector((state) => state.user);

  const dispatch = useDispatch()
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const { products, isLoading, isError, message } = useSelector(
    (state) => state.product
  );

  const userRole = currentUser.role
    console.log(userRole);

  if (userRole === 'author'){
    useEffect(() => {
      if (isLoggedIn) {
        dispatch(getProducts())
      }
      console.log(products);
    },[isLoggedIn,dispatch])
  }




  return (
    <div>
      ViewProducts
    </div>
  )
}

export default ViewProducts
