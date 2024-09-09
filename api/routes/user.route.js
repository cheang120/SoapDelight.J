import express from 'express'
import { deleteUser, getUsers, signout, test, updateUser } from '../controllers/user.controller.js'
import {addToWishlist, getCart,getWishlist,removeFromWishlist,saveCart} from '../controllers/auth.controller.js'
import { protect, verifiedOnly, authorOnly } from '../middleware/auth.middleware.js'
import { verifyToken } from '../utils/verifyUser.js'

const router = express.Router()

router.get('/test', test)
// router.post('/signout' , signout)
router.put('/update/:userId',verifyToken, updateUser)
router.delete('/delete/:userId',verifyToken, deleteUser)
// router.get('/getUsers', authorOnly, getUsers)

// Cart
router.get("/getCart", protect,getCart)
router.patch("/saveCart", protect, saveCart)



export default router 