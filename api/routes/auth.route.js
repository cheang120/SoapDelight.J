import express from 'express'
import { google, signin, signup ,getUser, signout,getUsers,loginStatus, upgradeUser,sendAutomatedEmail,sendVerificationEmail,verifyUser ,forgotPassword,resetPassword} from '../controllers/auth.controller.js'
import { authorOnly, protect,adminOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/signup', signup)
router.post('/signin', signin)
router.post('/google', google)
router.post('/signout' , signout)
router.get('/getuser',protect, getUser)
router.get('/getUsers', protect,getUsers)
// router.delete('/deleteUser/:id', protect, adminOnly, async (req, res, next) => {
//     const { id } = req.params;
//     try {
//         const user = await User.findByIdAndDelete(id);
//         if (!user) {
//             return next(new Error('User not found!'));
//         }
//         res.status(200).json({ message: 'User deleted successfully' });
//     } catch (error) {
//         next(error);
//     }
// });
router.get('/loginStatus', loginStatus)
router.post('/upgradeUser', protect, adminOnly, upgradeUser)
router.post('/sendAutomatedEmail', protect, sendAutomatedEmail)

router.post("/sendVerificationEmail",sendVerificationEmail);
router.patch('/verify/:verificationToken',verifyUser )
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:resetToken',resetPassword )


export default router