import {React,useState} from 'react'
import {Toaster, toast} from 'react-hot-toast';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';


const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit =async(e)=>{
      e.preventDefault();

        try {
            const response = await axios.post("http://localhost:3000/api/auth/login", {
                  email,
                  password,
                });
            if (response.data.success) {
                console.log(response.data);
                toast.success("Login successful");
                const {user} =response.data;
                localStorage.setItem("token", response.data.token); // Store the token in local storage
                localStorage.setItem("id",user._id);
                localStorage.setItem("Email",email);
                localStorage.setItem("Name",user.firstName);
                navigate("/"); 
                window.location.reload();
            }
        } catch (error) {
            console.error("Error during login:", error);
            if (error.response && error.response.status === 400) {
                toast.error("Invalid email or password");
            } else {
                toast.error("An error occurred. Please try again.");
            }
        }
    }

  return (
    <div>
       <div className='flex flex-col items-center justify-center min-h-screen bg-[#f9fafb] px-4'>
      <h2 className='text-3xl font-semibold text-[rgb(17,24,39)] mb-6'>Welcome Back</h2>
      <form onSubmit={handleSubmit} className='w-full max-w-md bg-white p-6 rounded-xl shadow space-y-4'>
        <input type='email' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} required className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]' />
        <input type='password' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} required className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]' />
        <button type='submit' className='w-full bg-[#3B82F6] text-white py-2 rounded-lg hover:bg-[#2563EB] transition'>Log In</button>
      <div className='text-center'>Don't Have Account ? <Link to="/signup" className='text-[#3B82F6]'>Sign Up</Link></div>
      </form>
    </div>
    </div>
  )
}

export default Login
