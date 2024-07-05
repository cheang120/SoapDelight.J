import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
// import OAuth from '../components/OAuth';

const initialState = {
  name:'',
  email:'',
  password:'',
  password2:''
}

export default function SignUp() {
  const [formData, setFormData] = useState(initialState);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    // console.log(e.target.value);
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };
  // console.log(formData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      return setErrorMessage('Please fill out all fields.');
    }
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        return setErrorMessage(data.message);
      }
      setLoading(false);
      if(res.ok) {
        navigate('/sign-in');
      }
    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };
  return (
    <div className='min-h-screen mt-20'>
      <div className='flex p-3 max-w-3xl mx-auto flex-col md:flex-row md:items-center gap-5'>
        {/* left */}
        <div className='flex-1'>
          <Link to='/' className='font-bold dark:text-white text-4xl'>
            <span className='px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>
              SoapDelight.J
            </span>
          </Link>
          <p className='text-sm mt-5'>
          SoapDelight.J為您帶來全新的澳門品牌，致力於提供品質天然的手工護膚品及手工皂。我們的產品以天然植物草本為基礎， 避免使用人工合成的有害防腐劑和硅油等成分。我們的手工皂和護膚品經過精心製作，不僅能夠潔淨肌膚，還能提供滋養和保護， 讓您的肌膚焕發健康光彩。 品牌故事源於一位媽媽對小朋友的愛與關懷。她希望為自己的小朋友提供天然的護膚體驗。 透過學習芳療和手工護膚品的知識，開始製作天然手工護膚品，並將自己的愛和熱情注入其中。 選擇SoapDelight.J， 您將獲得一個全新的護膚體驗。我們的產品不僅能保護和滋養肌膚，還能提供舒緩和放鬆的芳香療效。讓您的肌膚在天然的芳香中得到愛和呵護。 我們相信，天然是最好的選擇。讓SoapDelight.J成為您護膚品選擇的首選，讓您的肌膚感受到天然植物的美好。
          </p>
        </div>

        {/* right */}
        <div className='flex-1'>
          <form 
            className='flex flex-col gap-4' 
            onSubmit={handleSubmit}
          >
            <div>
              <Label value='Your username' />
              <TextInput
                type='text'
                placeholder='Username'
                id='username'
                onChange={handleChange}
              />
            </div>
            <div>
              <Label value='Your email' />
              <TextInput
                type='email'
                placeholder='name@company.com'
                id='email'
                onChange={handleChange}
              />
            </div>
            {/* <div>
              <Label value='Your password' />
              <TextInput
                type='password'
                placeholder='Password'
                id='password'
                onChange={handleChange}
              />
            </div> */}
            <div>
              <Label value='Password'/>
              <PasswordInput 
                type='text'
                placeholder="Password"
                name="password"
                id='password'
                onChange={handleChange}
              />
            </div>
            <div>
              <Label value='Confirm Password'/>
              <PasswordInput
                type='text'
                placeholder="Confirm Password"
                name="password2"
                id='password2'
                onChange={handleChange}
              />
            </div>

            <Button
              gradientDuoTone='purpleToPink'
              type='submit'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='pl-3'>Loading...</span>
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
            {/* <OAuth /> */}
          </form>
          <div className='flex gap-2 text-sm mt-5'>
            <span>Have an account?</span>
            <Link to='/sign-in' className='text-blue-500'>
              Sign In
            </Link>
          </div>
          {errorMessage && (
            <Alert className='mt-5' color='failure'>
              {errorMessage}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}