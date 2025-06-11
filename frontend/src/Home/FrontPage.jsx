import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import axios from 'axios';
import { IoHome } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { IoChatboxEllipsesSharp } from "react-icons/io5";
import { MdLocalPostOffice } from "react-icons/md";
import { Outlet } from 'react-router-dom';
import { FaUsers } from "react-icons/fa";
import { RiLogoutBoxLine } from "react-icons/ri";
import { FaUserPlus } from "react-icons/fa";
import { FaSignInAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Logo from '../../public/Logo2.png'

const FrontPage = () => {
  const navigate = useNavigate();

   const [email, setEmail] = useState('');
   const [id, setId] = useState(null);
   const [profile, setProfile] = useState(null);

   useEffect(() => {
     const fetchEmail= localStorage.getItem('Email');
     setEmail(fetchEmail);
   }, [email])

  useEffect(() => {
  const fetchProfile = async () => {
    const id = localStorage.getItem('id');
    setId(id);

    // ✅ Skip if ID is not present (user is logged out)
    if (!id) return;

    try {
      const response = await axios.post(
        "https://bondbase.onrender.com/api/user/id",
        { id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProfile(response.data.user);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch user profile");
    }
  };

  fetchProfile();
}, [id]);

   
   
  const logout=()=>{
    localStorage.removeItem("Email");
    localStorage.removeItem("Name");
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    setEmail("");
    setId(null);
    setProfile(null);
    navigate('/');
   }

  return (
    <>
    <div className='w-screen h-screen flex justify-center items-center '>
      <div className='w-[98vw] h-[96vh] bg-[#10121b66] backdrop-blur-xs mx-auto  rounded-3xl flex flex-col relative'>
            {/* <div className='py-4 px-3 border-b-[1px] border-[#71779040] mx-6 flex items-center justify-between'>
              <div className='text-2xl text-white font-semibold'>BondBase</div>
              <div className='flex gap-2'>
                <button className='bg-blue-600 px-3 py-2 rounded-md text-white cursor-pointer hover:bg-blue-700'>Sign Up</button>
                <button className='bg-blue-600 px-3 py-2 rounded-md text-white cursor-pointer hover:bg-blue-700'>Login</button>
              </div>
            </div> */}
         
            <div className='flex h-full relative'>
              <div className='lg:w-[23%] md:w-[38%] w-[18%] flex justify-start items-center relative flex-col my-3 border-r-[1px] border-[#71779040] px-1 sm:px-3 md:px-8'>
            <h1 className='text-[18px] font-semibold text-gray-400 mb-3 hidden sm:block'>Categories</h1>
            <div className='flex flex-col text-white gap-3 justify-start w-full '>
              <Link to={id ? '/home' : '/login'}><div className='text-[15px] font-semibold flex items-center justify-center sm:justify-start gap-3 hover:bg-[#10121b66] px-2 py-3 rounded-md cursor-pointer transition-all '><IoHome size={23} /><div className='hidden sm:block'>Home</div></div></Link>
              <Link to={id ? '/chat' : '/login'}><div className='text-[15px] font-semibold flex items-center justify-center sm:justify-start gap-3 hover:bg-[#10121b66] px-2 py-3 rounded-md cursor-pointer transition-all '><IoChatboxEllipsesSharp size={23} /><div className='hidden sm:block'>Chat</div> </div></Link>
              <Link to={id? '/profile' : '/login'}><div className='text-[15px] font-semibold flex items-center justify-center sm:justify-start gap-3 hover:bg-[#10121b66] px-2 py-3 rounded-md cursor-pointer transition-all '><CgProfile size={23} /><div className='hidden sm:block'>Profile</div> </div></Link>
              <Link to={id ? '/post' : '/login'}><div className='text-[15px] font-semibold flex items-center justify-center sm:justify-start gap-3 hover:bg-[#10121b66] px-2 py-3 rounded-md cursor-pointer transition-all '><MdLocalPostOffice size={23} /><div className='hidden sm:block'>Post</div> </div></Link>
              <Link to={id ? '/users' : '/login'}><div className='text-[15px] font-semibold flex items-center justify-center sm:justify-start gap-3 hover:bg-[#10121b66] px-2 py-3 rounded-md cursor-pointer transition-all '><FaUsers size={23} /><div className='hidden sm:block'>Other Users</div> </div></Link>
            </div>
            <div className='flex flex-col text-white gap-3 justify-start w-full border-t border-[#71779040] mt-3 pt-2'>
              {!email ? <>
              <Link to='/signup'><div className='text-[15px] font-semibold flex items-center gap-3 justify-center sm:justify-start hover:bg-[#10121b66] px-2 py-3 rounded-md cursor-pointer transition-all '><FaUserPlus size={23} /><div className='hidden sm:block'>Sign Up</div> </div></Link>
            <Link to='/login'><div className='text-[15px] font-semibold flex items-center gap-3 justify-center sm:justify-start hover:bg-[#10121b66] px-2 py-3 rounded-md cursor-pointer transition-all '><FaSignInAlt size={23} /><div className='hidden sm:block'>Login</div> </div></Link>
              </> :      <div onClick={logout} className='text-[15px] font-semibold flex items-center gap-3 justify-center sm:justify-start hover:bg-[#10121b66] px-2 py-3 rounded-md cursor-pointer transition-all '><RiLogoutBoxLine size={23} /><div className='hidden sm:block'>Log Out</div> </div>
              }

  <div className='text-[18px] w-[90%]  sm:w-[75%] font-semibold absolute bottom-0 flex items-center justify-center sm:justify-start  border-t border-[#71779040]  gap-3 hover:bg-[#10121b66] pt-3 sm:px-2 sm:py-3 rounded-md cursor-pointer transition-all '>
    <img
      src={Logo}
      alt="Profile"
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
    />
    <span className='hidden md:block'>BondBase</span>
  </div>
            </div>
            </div> 
      
          <div className='relative w-full h-[100%] overflow-y-scroll'>
            <Outlet />
            
            </div>
            </div>
            
          </div>
    </div>
    </>
  )
}

export default FrontPage
