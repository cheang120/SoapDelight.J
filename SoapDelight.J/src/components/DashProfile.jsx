import { Alert, Button, Modal, ModalBody, TextInput } from 'flowbite-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
// import {
//   getDownloadURL,
//   getStorage,
//   ref,
//   uploadBytesResumable,
// } from 'firebase/storage';
// import { app } from '../firebase';
// import { CircularProgressbar } from 'react-circular-progressbar';
// import 'react-circular-progressbar/dist/styles.css';
// import {
//   updateStart,
//   updateSuccess,
//   updateFailure,
//   deleteUserStart,
//   deleteUserSuccess,
//   deleteUserFailure,
//   signoutSuccess,
// } from '../redux/user/userSlice';
// import { useDispatch } from 'react-redux';
// import { HiOutlineExclamationCircle } from 'react-icons/hi';
// import { Link } from 'react-router-dom';

const DashProfile = () => {
  const {currentUser, error, loading} = useSelector(state => state.user)
  const [showModal, setShowModal] = useState(false);

  const handleSignout = async () => {
    try {
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className='max-w-lg mx-auto p-3 w-full'>

      <h1 className='my-7 text-center font-semibold text-3xl'>profile</h1>

      <form action="" className='flex flex-col gap-4'>
        <div className='relative w-32 h-32 self-center cursor-pointer shadow-md overflow-hidden rounded-full'>
          <img
              src={currentUser.profilePicture}
              alt='User Profile'
              className={`rounded-full w-full h-full object-cover border-8 border-[lightgray] ${
                // imageFileUploadProgress &&
                // imageFileUploadProgress < 100 &&
                'opacity-60'
              }`}
            />
        </div>
        <TextInput
          type='text'
          id='username'
          placeholder='username'
          defaultValue={currentUser.username}
          // onChange={handleChange}
        />
        <TextInput
          type='email'
          id='email'
          placeholder='email'
          defaultValue={currentUser.email}
          // onChange={handleChange}
        />
        <TextInput
          type='password'
          id='password'
          placeholder='password'
          // onChange={handleChange}
        />
        <Button
          type='submit'
          gradientDuoTone='purpleToBlue'
          outline
          // disabled={loading || imageFileUploading}
        >
          {loading ? 'Loading...' : 'Update'}
        </Button>
      </form>

      <div className='text-red-500 flex justify-between mt-5'>
        <span onClick={() => setShowModal(true)} className='cursor-pointer'>
          Delete Account
        </span>
        <span 
        onClick={handleSignout} 
        className='cursor-pointer'>
          Sign Out
        </span>
      </div>

    </div>
  )
}

export default DashProfile
