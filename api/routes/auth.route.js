import express from 'express'
import { google, signin, signup ,getUser, signout,getUsers, loginStatus, upgradeUser,sendAutomatedEmail,sendVerificationEmail,verifyUser ,forgotPassword} from '../controllers/auth.controller.js'
import { authorOnly, protect,adminOnly } from '../middleware/auth.middleware.js'


const router = express.Router()

router.post('/signup', signup)
router.post('/signin', signin)
router.post('/google', google)
router.post('/signout' , signout)
router.get('/getuser',protect, getUser)
router.get('/getUsers',protect,authorOnly, getUsers)
router.get('/loginStatus', loginStatus)
router.post('/upgradeUser', protect, adminOnly, upgradeUser)
router.post('/sendAutomatedEmail', protect, sendAutomatedEmail)

router.post("/sendVerificationEmail", protect,sendVerificationEmail);
router.patch('/verifyUser/:verificationToken',verifyUser )
router.post('/forgotPassword', forgotPassword)

export default router