import express from 'express'
import { google, signin, signup ,getUser, signout } from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'


const router = express.Router()

router.post('/signup', signup)
router.post('/signin', signin)
router.post('/google', google)
router.post('/signout' , signout)
router.get('/getuser',protect, getUser)

export default router