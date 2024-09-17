import { Footer } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { BsFacebook, BsInstagram, BsTwitter, BsGithub, BsDribbble } from 'react-icons/bs';

export default function FooterCom() {
  return (
    <Footer container className='border-t-8 border-teal-500'>
      <div className='w-full max-w-7xl mx-auto'>
        {/* Responsive grid layout for the footer */}
        <div className='flex flex-col sm:flex-row justify-between items-center py-4'>
          {/* Logo */}
          <div className='mb-4 sm:mb-0 sm:w-1/3 flex justify-center'>
            <Link
              to='/'
              className='flex whitespace-nowrap text-lg sm:text-xl font-semibold dark:text-white'
            >
              <span className='px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>
                Soapdelight.J
              </span>
            </Link>
          </div>

          {/* Copyright */}
          <div className='mb-4 sm:mb-0 sm:w-1/3 flex justify-center'>
            <Footer.Copyright
              href='https://www.carreyportfolio.lol/'
              by="babycode"
              year={new Date().getFullYear()}
            />
          </div>

          {/* Social Icons */}
          <div className='flex gap-6 sm:w-1/3 justify-center'>
            <Footer.Icon href='https://www.facebook.com/profile.php?id=61555597584696' icon={BsFacebook} />
            <Footer.Icon href='https://www.instagram.com' icon={BsInstagram} />
            <Footer.Icon href='https://www.twitter.com' icon={BsTwitter} />
            <Footer.Icon href='https://www.github.com' icon={BsGithub} />
            <Footer.Icon href='https://www.dribbble.com' icon={BsDribbble} />
          </div>
        </div>
      </div>
    </Footer>
  );
}
