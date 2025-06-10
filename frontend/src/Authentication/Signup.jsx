import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate ,Link} from 'react-router-dom'; // 🔹 Import useNavigate
import { toast, Toaster } from 'react-hot-toast';


const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // 🔹 Initialize navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post("https://bondbase.onrender.com/api/auth/signup", {
        firstName,
        lastName,
        email,
        password,
      });


      // Clear form fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");

      // 🔹 Redirect to login page
      navigate("/login");

    } catch (error) {
      toast.error(error.response.data.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className='flex flex-col items-center justify-center min-h-screen  px-4'>
      <form onSubmit={handleSubmit} className='w-full sm:w-[45%] bg-[#10121ba1] p-6 rounded-xl shadow space-y-4'>
              <h2 className='text-3xl font-bold text-center text-white mb-6'>Create Your Account</h2>

        <input
          type='text'
          placeholder='First Name'
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className='w-full px-4 py-2 border border-gray-100 rounded-lg focus:outline-none text-white'
        />
        <input
          type='text'
          placeholder='Last Name'
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className='w-full px-4 py-2 border border-gray-100 rounded-lg focus:outline-none text-white'
        />
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className='w-full px-4 py-2 border border-gray-100 rounded-lg focus:outline-none text-white'
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className='w-full px-4 py-2 border border-gray-100 rounded-lg focus:outline-none text-white'
        />

        <button
          type='submit'
          disabled={loading}
          className={`w-full text-white py-2 rounded-lg cursor-pointer transition ${
            loading ? 'bg-[#93C5FD] cursor-not-allowed' : 'bg-[#3B82F6] hover:bg-[#2563EB]'
          }`}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <div className='text-white text-center text-sm'>Already have account? <Link to='/login'><span className='text-blue-500 cursor-pointer'>Login</span></Link></div>
      </form>
    </div>
    </>
  );
};

export default Signup;
