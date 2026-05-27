import React from 'react'
import { AiFillGoogleCircle } from 'react-icons/ai'
import {GoogleAuthProvider, signInWithPopup, getAuth} from 'firebase/auth'
import { app } from '../firebase'
import { useDispatch } from 'react-redux'
import { signInSuccess } from '../redux/user/userSlice'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authSecondaryButtonClassName } from './auth/AuthShell'
// import {sendVerificationEmail} from '../redux/features/auth/authService'

const OAuth = () => {


    const auth = getAuth(app)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const handleGoogleClick = async () => {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({prompt:'select_account'})
        try {
            const resultsFromGoogle = await signInWithPopup(auth,provider)
            const res = await fetch('/api/auth/google', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({
                    name:resultsFromGoogle.user.displayName,
                    email:resultsFromGoogle.user.email,
                    googlePhotoUrl:resultsFromGoogle.user.photoURL
                })
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data?.message || 'Google 登入失敗。');
            }

            dispatch(signInSuccess(data))
            navigate('/')
        } catch (error) {
            const message =
              error?.code === "auth/unauthorized-domain"
                ? "此網域尚未啟用 Google 登入，請在 Firebase 授權網域加入目前網域。"
                : error?.message || error?.code || "Google 登入失敗。";
            console.error("Google sign-in failed:", error?.code || error?.message || error);
            toast.error(message);
        }
    }
  return (
    <button
      type='button'
      onClick={handleGoogleClick}
      className={authSecondaryButtonClassName}
    >
        <AiFillGoogleCircle className='mr-2 h-5 w-5'/>
        使用 Google 繼續
    </button>
  )
}

export default OAuth
