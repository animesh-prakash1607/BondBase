import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 🔹 Import useNavigate

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

      console.log(response.data);

      // Clear form fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");

      // 🔹 Redirect to login page
      navigate("/login");

    } catch (error) {
      console.error("Error during sign-up:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-[#f9fafb] px-4'>
      <h2 className='text-3xl font-semibold text-[rgb(17,24,39)] mb-6'>Create Your Account</h2>
      <form onSubmit={handleSubmit} className='w-full max-w-md bg-white p-6 rounded-xl shadow space-y-4'>
        <input
          type='text'
          placeholder='First Name'
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]'
        />
        <input
          type='text'
          placeholder='Last Name'
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]'
        />
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]'
        />
        <input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]'
        />

        <button
          type='submit'
          disabled={loading}
          className={`w-full text-white py-2 rounded-lg transition ${
            loading ? 'bg-[#93C5FD] cursor-not-allowed' : 'bg-[#3B82F6] hover:bg-[#2563EB]'
          }`}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
