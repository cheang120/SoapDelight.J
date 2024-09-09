import express from 'express'
import { google, signin, signup ,getUser, signout,getUsers,loginStatus, upgradeUser,sendAutomatedEmail,sendVerificationEmail,verifyUser ,forgotPassword,resetPassword, deleteUser, addToWishlist, getWishlist, removeFromWishlist} from '../controllers/auth.controller.js'
import { authorOnly, protect,adminOnly } from '../middleware/auth.middleware.js'
import { getCart, saveCart } from '../controllers/user.controller.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/signin', signin)
router.post('/google', google)
router.post('/signout' , signout)
router.get('/getuser',protect, getUser)
router.get('/getUsers', protect,adminOnly,getUsers)
router.delete('/deleteUser/:id', protect, adminOnly, deleteUser);
router.get('/loginStatus', loginStatus)
router.post('/upgradeUser', protect, adminOnly, upgradeUser)
router.post('/sendAutomatedEmail', protect, sendAutomatedEmail)

router.post("/sendVerificationEmail",sendVerificationEmail);
router.patch('/verify/:verificationToken',verifyUser )
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:resetToken',resetPassword )

// Cart
router.get("/getCart", protect,getCart)
router.patch("/saveCart", protect, saveCart)

// Wishlist
router.post("/addToWishlist", protect, addToWishlist)
router.get("/getWishlist", protect, getWishlist);
router.put("/wishlist/:productId", protect, removeFromWishlist);


export default router