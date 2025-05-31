import {React, useState, useEffect} from 'react'
import { Link } from 'react-router-dom'
import { FaHome } from "react-icons/fa";
import { MdOutlinePostAdd } from "react-icons/md";
import { IoChatboxEllipsesSharp } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";


const Header = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [sideBar, setSideBar] = useState(true);
    const [hover, setHover] = useState(false);
    const [id, setId] = useState("");

  
   useEffect(() => {
     setEmail(localStorage.getItem("Email"));
     setFirstName(localStorage.getItem("Name"));
     const storedId = localStorage.getItem("id");
      if (storedId) {
        setId(storedId);
      }
   },[])
   
   const logout=()=>{
    localStorage.removeItem("Email");
    localStorage.removeItem("Name");
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    setEmail("");
   }
  return (
    <div className='px-5  py-1 shadow-md bg-[#ffffff]'> 
      <nav className=' flex justify-between   items-center text-[#8f9394] p-3 rounded-2xl max-w-screen-xl mx-auto '>
        <div className='text-2xl font-bold'>
          <a href="/">My Website</a>
        </div>
        <ul className='flex  space-x-14 font-semibold'>
          <li>
  <Link to={id ? "/" : 'login'} className="group flex flex-col justify-center items-center">
    <FaHome
      className="text-[#666666] text-[25px] transition-all duration-300 group-hover:text-black "
    />
    <div className="text-[12px] mt-[-3px] text-[#666666] transition-all duration-300 group-hover:text-black">
      Home
    </div>
  </Link>
</li>

   <li className='mt-[-2px]'>
  <Link to={id ? "/post" : '/login'} className="group flex flex-col justify-center items-center">
    <MdOutlinePostAdd
      className="text-[#666666] text-[26px] transition-all duration-300 group-hover:text-black "
    />
    <div className="text-[12px] mt-[-3px] text-[#666666] transition-all duration-300 group-hover:text-black">
      Post
    </div>
  </Link>
</li>

   <li>
  <Link to={id ? "/chat" : '/login'} className="group flex flex-col justify-center items-center">
    <IoChatboxEllipsesSharp
      className="text-[#666666] text-[25px] transition-all duration-300 group-hover:text-black "
    />
    <div className="text-[12px] mt-[-3px] text-[#666666] transition-all duration-300 group-hover:text-black">
      Chat
    </div>
  </Link>
</li>

   <li>
  <Link to={id ? "/profile" : '/login'} className="group flex flex-col justify-center items-center">
    <CgProfile
      className="text-[#666666] text-[25px] transition-all duration-300 group-hover:text-black "
    />
    <div className="text-[12px] mt-[-3px] text-[#666666] transition-all duration-300 group-hover:text-black">
      Profile
    </div>
  </Link>
</li>
   </ul>
   
        {!email?  <div className='flex gap-3'>
          <button className='bg-[#1d1f20] text-white px-4 py-2 rounded-lg hover:bg-gray-700'>
          <Link to='/signup'>Sign In</Link>  
          </button>
          <button className='bg-[#1d1f20] text-white px-4 py-2 rounded-lg hover:bg-gray-700'>
          <Link to='/login'>Login</Link>  
          </button>
         </div> : <div onClick={()=>setSideBar(!sideBar)} className='bg-black text-white px-4 py-2 rounded-[50%] cursor-pointer'>{firstName[0]}</div>
         }
       
      </nav>
      {(!sideBar && email)  ? 
        <>
        <div className='w-[100px] bg-black text-white px-2 py-2 absolute top-17 right-3 rounded-md text-center'>
          <div onClick={logout} className='cursor-pointer'>Log Out</div>
        </div>
        </>   : null}
    </div>
  )
}

export default Header
