import React from 'react'
import { useDispatch } from 'react-redux'
import { RESET , verifyUser } from '../redux/features/auth/authSlice'
import { useParams,useNavigate } from 'react-router-dom'



const Verify = () => {
    const dispatch = useDispatch()
    const {verificationToken} = useParams()
    const navigate = useNavigate();

    const verifyAccount = async () => {
      console.log(`Verification Token: ${verificationToken}`);
        try {
          const res = await fetch(`/api/auth/verify/${verificationToken}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verificationToken }),
        });
        // console.log(verificationToken);

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON response but got ${contentType}`);
        }

    
          const data = await res.json();

    
          if (res.ok) {
            // Handle successful verification (e.g., dispatch an action, show a success message, redirect)
            alert(data.message);
            navigate('/dashboard?tab=profile')
          } else {
            // Handle errors (e.g., show an error message)
            alert(data.message);
          }
        } catch (error) {
          console.error('Error verifying account:', error);
          alert('An error occurred while verifying your account.');
        }
      };
    
  return (
    <section>
      <div className="flex justify-center items-center flex-col w-full mx-auto text-center min-h-screen">
        <h2>Account Verification</h2>
        <p>To verify your account, click the button below...</p>
        <br />
        <button onClick={verifyAccount} className='text-white bg-blue-500 z-10 text-base font-normal px-2 py-1 mr-5 border border-transparent rounded-md cursor-pointer flex justify-center items-center transition duration-300 ease-in-out'>
            Verify
        </button>
      </div>
    </section>
  )
}

export default Verify
