import React, { useState, useRef  } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'; // Install lucide-react for icons
import toast, { Toaster } from 'react-hot-toast';

const Post = () => {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!description.trim() && images.length === 0) {
      setError('Please add a description or upload at least one image.');
      return;
    }

    const formData = new FormData();
    formData.append('description', description);
    const id = localStorage.getItem('id');
    formData.append('userId', id);
    images.forEach((image) => formData.append('images', image));

    try {
      setLoading(true);
      const res = await axios.post('https://bondbase.onrender.com/api/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSuccess('Post created successfully!');
      setDescription('');
      setImages([]);
      setPreviewUrls([]);
      if (fileInputRef.current) {
  fileInputRef.current.value = ''; // 👈 reset file input
}

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Toaster />
   
    <div className="w-[95%] mx-auto mt-12 p-6 bg-[#10121b66] shadow-lg rounded-xl ">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Create a Post</h2>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-600 bg-red-100 rounded">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm text-green-600 bg-green-100 rounded">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <textarea
          rows={4}
          className="w-full p-4 border rounded-lg resize-none text-white focus:outline-none mb-4"
          placeholder="What's on your mind?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
        ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className=" block w-full text-sm cursor-pointer text-white file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-100 file:text-gray-700
            hover:file:bg-gray-200"
        />

        <div className="flex flex-wrap gap-3 my-4 ml-2 cursor-pointer">
          {previewUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`preview-${idx}`}
              className="w-24 h-24 rounded-lg object-cover border transition-transform duration-300 hover:scale-105"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center cursor-pointer gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 ${
            loading ? 'cursor-not-allowed opacity-70' : ''
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              Posting...
            </>
          ) : (
            'Post'
          )}
        </button>
      </form>
    </div>
     </>
  );
};

export default Post;
