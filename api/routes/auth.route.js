import express from 'express'
import { google, signin, signup ,getUser, signout,getUsers, loginStatus } from '../controllers/auth.controller.js'
import { authorOnly, protect } from '../middleware/auth.middleware.js'


const router = express.Router()

router.post('/signup', signup)
router.post('/signin', signin)
router.post('/google', google)
router.post('/signout' , signout)
router.get('/getuser',protect, getUser)
router.get('/getUsers',protect,authorOnly, getUsers)
router.get('/loginStatus', loginStatus)

export default router