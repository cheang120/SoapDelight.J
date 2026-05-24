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
                throw new Error(data?.message || 'Google sign-in failed.');
            }

            dispatch(signInSuccess(data))
            navigate('/')
        } catch (error) {
            const message =
              error?.code === "auth/unauthorized-domain"
                ? "Google sign-in is not enabled for this domain yet. Please add localhost to the Firebase authorized domains."
                : error?.message || error?.code || "Google sign-in failed.";
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
        Continue with Google
    </button>
  )
}

export default OAuth
