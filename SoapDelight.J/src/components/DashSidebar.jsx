import { Sidebar } from 'flowbite-react';
import {
  HiUser,
  HiArrowSmRight,
  HiDocumentText,
  HiOutlineUserGroup,
  HiAnnotation,
  HiChartPie,
} from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { Link, useLocation,useNavigate } from 'react-router-dom';
import { signoutSuccess } from '../redux/user/userSlice';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

export default function DashSidebar () {
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);
    const [tab, setTab] = useState('');

    // console.log(currentUser.role);
    const userRole = currentUser.role

    
    useEffect(() => {
      const urlParams = new URLSearchParams(location.search);
      const tabFromUrl = urlParams.get('tab');
      if (tabFromUrl) {
        setTab(tabFromUrl);
      }

      // 當tab為users且userRole不為admin時重定向
    if (tabFromUrl === 'users' && userRole !== 'admin') {
      navigate('/dashboard?tab=profile');
    }
    }, [location.search,userRole, navigate]);

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
    <Sidebar className='w-full md:w-56'>
      <Sidebar.Items>
      <Sidebar.ItemGroup className='flex flex-col gap-1'>
        <Link to='/dashboard?tab=profile' >
            <Sidebar.Item as='div' active={tab === 'profile'} icon={HiUser} label={userRole} labelColor='dark'>
                Profile
            </Sidebar.Item>
        </Link>
          {userRole === 'admin' && (
            <Link to='/dashboard?tab=users'>
              <Sidebar.Item as='div' active={tab === 'users'} icon={HiUser} labelColor='dark'>
                Users
              </Sidebar.Item>
            </Link>
          )}
          {/* {(userRole === 'author' ||  userRole === 'admin')  && (
            <Link to='/dashboard?tab=productAdmin'>
              <Sidebar.Item as='div' active={tab === 'productAdmin'} icon={HiUser} labelColor='dark'>
                Product Admin
              </Sidebar.Item>
            </Link>
          )} */}
          <Sidebar.Item  
              icon={HiArrowSmRight}
              className='cursor-pointer'
              onClick={handleSignout}
          >
                Sign Out
            </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  )
}


