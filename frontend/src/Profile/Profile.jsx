import {React , useState, useEffect, useRef} from 'react'
import axios from 'axios'
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import { MdModeEditOutline } from "react-icons/md";
import { FaRegCommentDots } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'; // Install lucide-react for icons
import { toast, Toaster } from 'react-hot-toast';
import { MdDelete } from "react-icons/md";

import {
  LoaderCircle
} from 'lucide-react';
import {
  User,
  Mail,
  ImagePlus,
  PencilLine,
  Info,
  BadgeCheck,
  Eye
} from 'lucide-react';




const Profile = () => { 
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState([]);
  const [id, setId] = useState(''); 
  const [commentInput, setCommentInput] = useState({});
  const [replyInput, setReplyInput] = useState({});
const [showReplyBox, setShowReplyBox] = useState(null); // holds active commentId or null
  const [showReplies, setShowReplies] = useState({});
  const [followers, setFollowers] = useState([]);
const [following, setFollowing] = useState([]);
const [allUsers, setAllUsers] = useState([]);
const [isPrivate, setIsPrivate] = useState(null);
const [edit, setEdit] = useState(false);
const [openMenu, setOpenMenu] = useState({});
const [commentBox, setCommentBox] = useState({});
  const [saving, setSaving] = useState(false);
  const menuRefs = useRef({});
  const toggleRefs = useRef({});
  const commentBoxRefs = useRef({});
  const commentToggleRefs = useRef({});

  const [commentLoading, setCommentLoading] = useState({});
  const [deleteCommentLoading, setDeleteCommentLoading] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [deleteReplyLoading, setDeleteReplyLoading] = useState({});
  const [likeLoading, setLikeLoading] = useState({});
  const [deletePostLoading, setDeletePostLoading] = useState({});

  
  
  
  
  const toggleMenu = (commentId) => {
      setOpenMenu((prev) => ({
        ...prev,
        [commentId]: !prev[commentId],
      }));
    };
  
    useEffect(() => {
    const handleOutsideClick = (e) => {
      Object.entries(menuRefs.current).forEach(([id, menuEl]) => {
        const toggleEl = toggleRefs.current[id];
  
        if (
          menuEl &&
          !menuEl.contains(e.target) &&
          toggleEl &&
          !toggleEl.contains(e.target)
        ) {
          setOpenMenu((prev) => ({ ...prev, [id]: false }));
        }
      });
    };
  
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  
  
  useEffect(() => {
    const handleOutsideCommentClick = (e) => {
      Object.entries(commentBoxRefs.current).forEach(([id, boxEl]) => {
        const toggleEl = commentToggleRefs.current[id];
  
        if (
          boxEl &&
          !boxEl.contains(e.target) &&
          toggleEl &&
          !toggleEl.contains(e.target)
        ) {
          setCommentBox((prev) => ({ ...prev, [id]: false }));
        }
      });
    };
  
    document.addEventListener('mousedown', handleOutsideCommentClick);
    return () => document.removeEventListener('mousedown', handleOutsideCommentClick);
  }, []);

    const [currentImageIndex, setCurrentImageIndex] = useState({});


useEffect(() => {
  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('https://bondbase.onrender.com/api/user/allUsers',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      ); // Replace with your actual endpoint
      setAllUsers(response.data);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  fetchUsers();
}, []);


const handleFollowToggle = async (targetUserId) => {
  try {
    // Optimistically update
    const isAlreadyFollowing = following.some(user => user._id === targetUserId);
    const updatedFollowing = isAlreadyFollowing
      ? following.filter(user => user._id !== targetUserId)
      : [...following, { _id: targetUserId }];
    setFollowing(updatedFollowing);

    // Backend update
    await axios.put(`https://bondbase.onrender.com/api/user/follow/${targetUserId}`, {
      currentUserId: id,
    });

    // Refetch user data to sync
    const updatedUser = await axios.post("https://bondbase.onrender.com/api/user/id", { id });
    setUser(updatedUser.data.user);
    setFollowing(updatedUser.data.user.following || []); // ✅ CORRECT HERE AGAIN

  } catch (error) {
    toast.error(error.response.data.message);
  }
};

 
useEffect(() => {
  const userId = localStorage.getItem('id');
  setId(userId);

  const fetchData = async () => {
    try {
      const response = await axios.get('https://bondbase.onrender.com/api/posts/allPosts');
      setFormData(response.data);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  fetchData();

  // Socket.io connection
  const socket = io('https://bondbase.onrender.com', {

    withCredentials: true,
  });

  // 🔴 Listen for real-time events
  socket.on('newPost', (newPost) => {
    setFormData((prev) => [newPost, ...prev]);
  });

  socket.on('postLiked', ({ postId, likes }) => {
    setFormData((prev) =>
      prev.map((post) =>
        post._id === postId ? { ...post, likes } : post
      )
    );
  });

  socket.on('postCommented', ({ postId, comments }) => {
    setFormData((prev) =>
      prev.map((post) =>
        post._id === postId ? { ...post, comments } : post
      )
    );
  });

   socket.on('commentReplied', ({ postId, commentId, replies }) => {
    setFormData((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment._id === commentId
                  ? { ...comment, replies }
                  : comment
              ),
            }
          : post
      )
    );
  });
  

  // Clean up on unmount
  return () => {
    socket.disconnect();
  };
}, []);

 const fetchUser = async () => {
    const userId = localStorage.getItem("id");
    try {
      const response = await axios.post("https://bondbase.onrender.com/api/user/id", 
        { id: userId }, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUser(response.data.user);
      setFollowing(response.data.user.following || []); // ✅ Set following state
      setIsPrivate(response.data.user.privacy);
      setIsPrivate(response.data.user.privacy || 'public');

    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  useEffect(() => {
  fetchUser();
}, []);

const handleDeletePost = async (postId) => {
  if (deletePostLoading[postId]) return; // Prevent duplicate click

  setDeletePostLoading(prev => ({ ...prev, [postId]: true }));

  try {
    await axios.delete(`https://bondbase.onrender.com/api/posts/delete/${postId}/${id}`);
    setFormData(prev => prev.filter(p => p._id !== postId));
  } catch (error) {
    toast.error(error?.response?.data?.message || "Failed to delete post");
  } finally {
    setDeletePostLoading(prev => ({ ...prev, [postId]: false }));
  }
};



const handleDeleteComment = async (postId, commentId) => {
  const id = localStorage.getItem('id');
  if (!id) return console.error("User ID not found in localStorage");

  // Prevent multiple clicks
  if (deleteCommentLoading[commentId]) return;

  setDeleteCommentLoading(prev => ({ ...prev, [commentId]: true }));

  try {
    const response = await axios.delete(
      `https://bondbase.onrender.com/api/posts/delete/comment/${postId}/${commentId}/${id}`
    );

    setFormData(prev =>
      prev.map(p =>
        p._id === postId ? { ...p, comments: response.data.comments } : p
      )
    );

    toast.success("Comment deleted successfully");
  } catch (error) {
    toast.error(error?.response?.data?.message || "Error deleting comment");
  } finally {
    setDeleteCommentLoading(prev => ({ ...prev, [commentId]: false }));
  }
};

const handleDeleteReply = async (postId, commentId, replyId) => {
  const id = localStorage.getItem("id");
  if (!id) return;

  // Prevent multiple clicks
  if (deleteReplyLoading[replyId]) return;

  setDeleteReplyLoading(prev => ({ ...prev, [replyId]: true }));

  try {
    const response = await axios.delete(
      `https://bondbase.onrender.com/api/posts/delete/reply/${postId}/${commentId}/${replyId}/${id}`
    );

    const updatedComment = response.data.comment;

    setFormData(prev =>
      prev.map(p =>
        p._id === postId
          ? {
              ...p,
              comments: p.comments.map(c =>
                c._id === commentId ? updatedComment : c
              )
            }
          : p
      )
    );

    toast.success("Reply deleted successfully");
  } catch (error) {
    toast.error(error?.response?.data?.message || "Error deleting reply");
  } finally {
    setDeleteReplyLoading(prev => ({ ...prev, [replyId]: false }));
  }
};


const handlePrivacyToggle = async () => { 
  try {
    const newPrivacy = isPrivate === 'private' ? 'public' : 'private';
    setIsPrivate(newPrivacy); // Update local state immediately

    await axios.put("https://bondbase.onrender.com/api/user/privacy", {
      userId: id,
      isPrivate: newPrivacy,
    });
  } catch (error) {
    toast.error(error.response.data.message);
  }
};

   const handleLike = async (postId) => {
  if (likeLoading[postId]) return; // prevent multiple clicks

  setLikeLoading(prev => ({ ...prev, [postId]: true }));

  try {
    const response = await axios.put(
      `https://bondbase.onrender.com/api/posts/like/${postId}`,
      { userId: id }
    );

    const updatedPost = response.data;

    setFormData(prev =>
      prev.map(p =>
        p._id === updatedPost._id
          ? {
              ...updatedPost,
              userId: p.userId // retain original populated user
            }
          : p
      )
    );
  } catch (err) {
    toast.error(err?.response?.data?.message || "Failed to like post");
  } finally {
    setLikeLoading(prev => ({ ...prev, [postId]: false }));
  }
};

  const handleEditProfile = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('profilePhoto', e.target.profilePhoto.files[0]);
  formData.append('firstName', e.target.firstName.value);
  formData.append('lastName', e.target.lastName.value);
  formData.append('email', e.target.email.value);
  formData.append('bio', e.target.bio.value);
  formData.append('title', e.target.title.value);
      setSaving(true);

  try {
    const response = await axios.patch(`https://bondbase.onrender.com/api/user/updateProfile/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token if needed
      },
    });
    await fetchUser(); 
    setEdit(!edit);
    setTimeout(() => {
      setSaving(false);
      toast.success('Profile updated successfully!');
    }, );
  } catch (err) {
    toast.error(err.response.data.message);
  }
};

const handleComment = async (postId) => {
  if (!commentInput[postId]) return;

  // Set loading true for the specific post
  setCommentLoading(prev => ({ ...prev, [postId]: true }));

  try {
    await axios.post(`https://bondbase.onrender.com/api/posts/comment/${postId}`, {
      userId: id,
      text: commentInput[postId]
    });

    const allPostsResponse = await axios.get("https://bondbase.onrender.com/api/posts/allPosts");
    setFormData(allPostsResponse.data);
  } catch (err) {
    toast.error(err.response?.data?.message || "Error posting comment");
  } finally {
    // Reset loading and clear input for the specific post
    setCommentLoading(prev => ({ ...prev, [postId]: false }));
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
  }
};

const handleReply = async (postId, commentId) => {
  if (!replyInput[commentId]) return;

  // Prevent multiple clicks
  if (replyLoading[commentId]) return;

  setReplyLoading(prev => ({ ...prev, [commentId]: true }));

  try {
    const response = await axios.post(
      `https://bondbase.onrender.com/api/posts/reply/${postId}/${commentId}`,
      {
        userId: id,
        text: replyInput[commentId]
      }
    );

    const updatedPost = response.data;

    setFormData(prev =>
      prev.map(p => (p._id === updatedPost._id ? updatedPost : p))
    );

    setReplyInput(prev => ({ ...prev, [commentId]: '' }));
    setShowReplyBox(prev => ({ ...prev, [commentId]: false }));
  } catch (err) {
    toast.error(err?.response?.data?.message || "Reply failed");
  } finally {
    setReplyLoading(prev => ({ ...prev, [commentId]: false }));
  }
};

const getRelativeTime = (date) => {
  const now = new Date();
  const posted = new Date(date);
  const seconds = Math.floor((now - posted) / 1000);

  const intervals = {
    year: 31536000,
    mon: 2592000,
    w: 604800,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1,
  };

  for (const key in intervals) {
    const interval = Math.floor(seconds / intervals[key]);
    if (interval >= 1) {
      return `${interval}${key}${interval > 1 ? '' : ''}`;
    }
  }
  return 'just now';
};

  return (
    <>
          <Toaster  />

    <div>
      <div className="flex flex-col items-center justify-center mt-8 px-2">
  <h2 className="text-3xl font-bold text-white mb-8">Profile</h2>

  {user && !edit  ? (
    <div className="w-full  bg-[#10121b66] p-[10px] sm:p-6 rounded-2xl shadow-lg space-y-6">
      {/* Profile Header */}
      <div className="flex justify-between items-center border-b-[1px] pb-3 sm:pb-6 border-[#71779040]">
        <div className='flex items-center space-x-3 sm:space-x-7'>
           <img
          src={user.profilePhoto || '/default-profile.png'}
          alt={user.firstName}
          className="w-15 h-15 sm:w-20 sm:h-20 rounded-full object-cover hover:scale-110 transition-all ring-2 ring-[#10121b66]"
        />
        <div>
          <h2 className="text-[16px] sm:text-3xl font-semibold text-white">{user.firstName} {user.lastName}</h2>
          <p className='text-[14px] sm:text-xl text-gray-400'>{user.title}</p>
          {/* <p className="text-sm text-gray-500">{user.email}</p> */}
        </div>
        </div>
       
       <div className='mb-5 cursor-pointer transition duration-300 bg-red-500 hover:bg-red-700 p-2 rounded-md' onClick={()=>{setEdit(!edit)}}>
        <button className='flex text-white justify-center items-center gap-2 cursor-pointer'>
        <span className='hidden sm:block'>Edit Profile </span> <MdModeEditOutline size={18} />
        </button>
        </div>
      </div>

      <div className='bg-[#10121b66] p-1 rounded-md'>
      <div className='flex flex-col gap-1 sm:gap-0 sm:flex-row justify-between p-2 rounded-md'>
        <div className='flex items-center gap-1'>
          <h3 className='text-white text-[17px] font-semibold'>Email :</h3>
          <div className='text-gray-200 text-[16px]'>{user.email}</div>
        </div>
        <div className='flex items-center gap-1'>
          <h3 className='text-white text-[17px] font-semibold'>Privacy :</h3>
          <div className='text-gray-200 text-[16px] '>{isPrivate.charAt(0).toUpperCase() + isPrivate.slice(1)}</div>
        </div>
      </div>

      {/* Bio */}
      <div className="text-gray-200 mb-4 px-2 py-1 sm:px-3 rounded-md">
        <h3 className="text-lg font-semibold  text-white">Bio:</h3>
        {user.bio || 'No bio added yet.'}
        </div>
      </div>

       <div className='w-full bg-[#10121b66] text-white p-3 sm:p-6 rounded-xl shadow space-y-1 mt-[-15px] sm:mt-4 mx-auto'>
  <h2 className='text-lg font-bold'>Privacy </h2>
  <div className='flex justify-between items-center sm:flex-row flex-col sm:gap-0 gap-2'>
      <p>Your profile is currently <strong>{isPrivate}</strong></p>
    <button
      onClick={handlePrivacyToggle}
      className='bg-indigo-500 text-white px-4 py-1 rounded hover:bg-indigo-600 cursor-pointer transition duration-200'
    >
        Make {isPrivate === 'private' ? 'Public' : 'Private'}
    </button>
  </div>
</div>

      {/* Stats */}
      <div className="flex justify-between text-center text-white mt-[-15px] sm:mt-0">
        <div className="flex flex-col items-center justify-center bg-[#10121b66] w-[80px] sm:w-[100px] pt-1 pb-2 rounded-md transition-transform hover:scale-110 duration-300">
          <div className="text-lg font-bold">{user.posts?.length || 0}</div>
          <div className="text-sm text-white mt-[-5px]">Posts</div>
        </div>
        <div className="flex flex-col items-center justify-center bg-[#10121b66] w-[80px] sm:w-[100px] pt-1 pb-2 rounded-md transition-transform hover:scale-110 duration-300">
          <div className="text-lg font-bold">{user.followers?.length || 0}</div>
          <div className="text-sm text-white mt-[-5px]">Followers</div>
        </div>
        <div className="flex flex-col items-center justify-center bg-[#10121b66] w-[80px] sm:w-[100px] pt-1 pb-2 rounded-md transition-transform hover:scale-110 duration-300">
          <div className="text-lg font-bold">{user.following?.length || 0}</div>
          <div className="text-sm text-white mt-[-5px]">Following</div>
        </div>
      </div>

      
    </div>
  ) : !edit ? (
    <p className="text-gray-600">Loading...</p>
  ): null}
</div>

   {edit && (
        <div className="w-[96%] mx-auto bg-[#10121b66] py-4 px-6 rounded-xl shadow-md mt-[-20px]">
          <div className='flex justify-between items-center mb-3'>
                      <h1 className="text-2xl font-bold text-white text-center ">Edit Profile</h1>
              <button onClick={()=> setEdit(!edit)}  className='text-white bg-red-600 rounded-md px-3 py-1 cursor-pointer hover:bg-red-700'>
                Cancel
                </button>
          </div>
          <div className="w-full bg-[#71779040] h-[0.5px] mb-3"></div>

          <form onSubmit={handleEditProfile} className="flex flex-col items-center justify-center gap-4 w-full">
            {/* Profile Photo */}
            <div className="w-full">
              <label className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                <ImagePlus size={16} /> Profile Photo
              </label>
              <input
                name="profilePhoto"
                type="file"
                accept="image/*"
                className="w-full text-sm text-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {/* First Name */}
            <div className="w-full">
              <label className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                <User size={16} /> First Name
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter your first name"
                className="w-full border text-white border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                value={user.firstName}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
              />
            </div>

            {/* Last Name */}
            <div className="w-full">
              <label className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                <User size={16} /> Last Name
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter your last name"
                className="w-full border text-white border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                value={user.lastName}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="w-full">
              <label className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full border text-white border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </div>

            {/* Title */}
            <div className="w-full">
              <label className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                <BadgeCheck size={16} /> Title
              </label>
              <input
                type="text"
                name="title"
                placeholder="Your professional title"
                className="w-full border text-white border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                value={user.title}
                onChange={(e) => setUser({ ...user, title: e.target.value })}
              />
            </div>

            {/* Bio */}
            <div className="w-full">
              <label className="block text-sm font-medium text-white mb-1 flex items-center gap-2">
                <Info size={16} /> Bio
              </label>
              <textarea
                name="bio"
                rows={4}
                placeholder="Tell something about yourself"
                className="w-full border border-gray-300 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                value={user.bio}
                onChange={(e) => setUser({ ...user, bio: e.target.value })}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3 cursor-pointer rounded-lg font-semibold transition duration-200
                ${saving ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
              `}
            >
              {saving ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <PencilLine size={18} /> Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      )}    


      <div className='mt-12 mb-10 sm:mt-24 px-2'>
              <h2 className='text-3xl font-bold text-center mb-8 text-white'>User Posts</h2>
              <div className='grid grid-cols-1 md:grid-cols-2  gap-6'>
                   {formData && formData.length > 0 ? (
                formData
                  .filter(post => 
                  post?.userId?._id === id 
                  ).map((post, index) => (
                              <div key={index} className='bg-[#10121b66] px-4 sm:px-8 py-5 rounded-xl transition'>
                                <div className='flex justify-between items-center '>
                                  <div className='flex items-center'>
                                     <img
                                    src={post.userId?.profilePhoto || '/default-profile.png'}
                                    alt='Profile'
                                    className='w-10 h-10 rounded-full mr-3 object-cover'
                                  />
                                  <div>
                                    <Link to={`/user/${post.userId?._id}`}><p className='font-semibold hover:underline transition-all duration-200 text-white'>{post.userId?.firstName} {post.userId?.lastName}</p></Link>
                                    <p className='text-sm text-gray-300'>{new Date(post.createdAt).toLocaleString()}</p>
                                  </div>
                                  </div>
                                 
                                <div>
  <button
    onClick={() => handleDeletePost(post._id)}
    disabled={deletePostLoading[post._id]}
    className={`bg-red-500 text-white px-3 py-1 rounded-md hidden sm:block transition ${
      deletePostLoading[post._id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700 cursor-pointer'
    }`}
  >
    {deletePostLoading[post._id] ? 'Deleting...' : 'Delete'}
  </button>

  <button
    onClick={() => handleDeletePost(post._id)}
    disabled={deletePostLoading[post._id]}
    className={`bg-red-500 text-white px-2 py-1 rounded-md sm:hidden transition ${
      deletePostLoading[post._id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700 cursor-pointer'
    }`}
  >
    <MdDelete size={20} />
  </button>
</div>

                                </div>
                
                            {post.images?.length > 0 && (
                  <div className="relative w-[100%] max-w-xl mx-auto">
                    <div className="relative mt-4">
                      <img
                        src={post.images[currentImageIndex[post._id] || 0]}
                        alt={`Post ${post._id}`}
                        className="max-h-[500px] bg-[#10121b66] w-full object-contain rounded-lg"
                      />
                      {/* {post.images.length > 1 && (
                        <>
                          <button
                            onClick={() => prevImage(post._id, post.images)}
                            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full"
                          >
                            ‹
                          </button>
                          <button
                            onClick={() => nextImage(post._id, post.images)}
                            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full"
                          >
                            ›
                          </button>
                        </>
                      )} */}
                    </div>
                
                    {/* Dots Navigation */}
                    <div className="flex justify-center gap-2 mt-2">
                      {post.images.map((_, index) => (
                        <button
                          key={index}
                          className={`h-2 w-2 rounded-full cursor-pointer ${
                            (currentImageIndex[post._id] || 0) === index
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                          onClick={() =>
                            setCurrentImageIndex((prev) => ({
                              ...prev,
                              [post._id]: index,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                      <p className='text-white font-semibold my-3 text-[15px] '>{post.description}</p>
                
                    <div className='flex justify-between items-center  text-white'>
                      <div className='text-[13px]'>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</div>
                      <div className='text-[13px]'>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</div>
                    </div>
                
                         <div className='h-[0.5px] bg-gray-500 mt-2'></div>
                
                        <div className='flex justify-between items-center mt-2 mb-[-8px]'>
                          <div className='flex items-center gap-2'>
                              <button
                               onClick={() => handleLike(post._id)}
                               disabled={likeLoading[post._id]}
                               className={`transition ${
                                 likeLoading[post._id] ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                               }`}
                             >
                               {post.likes.includes(id) ? (
                                 <FaHeart className='text-white text-xl' />
                               ) : (
                                 <FaRegHeart className='text-white text-xl' />
                               )}
                             </button>
                                  <div className='text-white'>Like</div>
                          </div>
                          <div className='flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-[#10121b66]' onClick={() =>
    setCommentBox((prev) => ({
      ...prev,
      [post._id]: !prev[post._id],
    }))
  }
  ref={(el) => {
    if (el) commentToggleRefs.current[post._id] = el;
    else delete commentToggleRefs.current[post._id];
  }}
                >
                            <FaRegCommentDots size={20} className='text-white'/>
                            <div className='text-white '>Comment</div>
                          </div>
                
                        </div>
                                {/* Like Button */}
                                {/* <div className='mt-4 flex items-center gap-3'>
                                  <button onClick={() => handleLike(post._id)}>
                                    {post.likes.includes(id) ? (
                                      <FaHeart className='text-red-500 text-xl cursor-pointer' />
                                    ) : (
                                      <FaRegHeart className='text-gray-500 text-xl cursor-pointer' />
                                    )}
                                  </button>
                                  <span>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</span>
                                </div> */}
                
                                {/* Comments */}
                          {commentBox[post._id] && (
                          <div className='mt-4' ref={(el) => {
      if (el) commentBoxRefs.current[post._id] = el;
      else delete commentBoxRefs.current[post._id];
    }}>
                            <div className='flex items-center gap-2'>
                                  <input
                                    type='text'
                                    placeholder='Add a comment...'
                                    value={commentInput[post._id] || ''}
                                    onChange={(e) =>
                                      setCommentInput(prev => ({ ...prev, [post._id]: e.target.value }))
                                    }
                                    className='w-full border px-3 py-1 rounded-md text-white'
                                  />
                                    <button
  onClick={() => handleComment(post._id)}
  disabled={commentLoading[post._id]}
  className={`text-white cursor-pointer w-full sm:w-fit px-3 py-1 rounded-md transition duration-200 ${
    commentLoading[post._id] ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
  }`}
>
  {commentLoading[post._id] ? 'Posting...' : 'Comment'}
</button>
                                 </div>
                                  <div className='mt-3 max-h-40 overflow-y-auto mx-3'>
                                  <div className='font-semibold text-[12px] text-white my-1'>{post.comments.length === 0 ? 'No comments yet' : 'Comments'}</div>
                {[...post.comments].reverse().map((c, i) => (
                  <div key={i} className='mb-2 sm:mx-1 relative bg-[#15182666] p-2 rounded-md'>
                    <div className='text-sm text-white '>
                      <div className='font-semibold flex items-center justify-between'>
                       <div>{c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'User'} </div>  
                    <div className='flex items-center justify-center gap-1'><div className='text-[12px] text-white'>{getRelativeTime(c.createdAt)}</div> <div ref={(el) => {
    if (el) toggleRefs.current[c._id] = el;
    else delete toggleRefs.current[c._id];
  }}
  onClick={(e) => {
    e.stopPropagation(); // Prevent it from closing immediately
    toggleMenu(c._id);
  }} className='cursor-pointer hover:bg-[#10121b66] rounded-full p-1'><BsThreeDots size={16} className=''/></div></div>    
                      </div> 
                      {/*  */}
                    
                    </div>
                    <div className='text-sm text-gray-300'>
                    {c.text}  
                    </div>
                
                    {openMenu[c._id] ?  (
                     <div
                     ref={(el) => {
      if (el) menuRefs.current[c._id] = el;
      else delete menuRefs.current[c._id];
    }}
                      className=' bg-[#15182666] text-white px-2 py-2 flex flex-col justify-center items-center absolute top-[-15px] right-10 rounded-md font-semibold shadow-lg gap-2'>
                     { c.userId._id === id  && (
                        <button
  onClick={() => handleDeleteComment(post._id, c._id)}
  disabled={deleteCommentLoading[c._id]}
  className={`text-xs w-[70px] py-1 rounded-md cursor-pointer transition ${
    deleteCommentLoading[c._id]
      ? 'bg-gray-700 cursor-not-allowed'
      : 'bg-red-500 hover:bg-red-600'
  }`}
>
  {deleteCommentLoading[c._id] ? 'Deleting...' : 'Delete'}
</button>
                    )} 
                   <button 
  onClick={() =>
    setShowReplyBox(prev => (prev === c._id ? null : c._id)) // toggle
  }
  className='text-xs cursor-pointer bg-green-500 w-full py-1 rounded-md hover:bg-green-600'
>
  {showReplyBox === c._id ? 'Cancel' : 'Reply'}
</button>

                    </div>)
                    : null
                    
                    }  
                    
                    
                
                    {/* Reply Input */}
                    {showReplyBox === c._id && (
  <div className='mt-1'>
    <input
      type='text'
      placeholder='Write a reply...'
      value={replyInput[c._id] || ''}
      onChange={(e) =>
        setReplyInput(prev => ({ ...prev, [c._id]: e.target.value }))
      }
      className='w-full border text-white mt-1 px-2 py-1 rounded-md text-sm border-white'
    />
    <button
      onClick={() => handleReply(post._id, c._id)}
      disabled={replyLoading[c._id]}
      className={`my-1 text-white px-2 py-1 text-xs rounded cursor-pointer transition ${
        replyLoading[c._id]
          ? 'bg-gray-700 cursor-not-allowed'
          : 'bg-green-500 hover:bg-green-600'
      }`}
    >
      {replyLoading[c._id] ? 'Replying...' : 'Reply'}
    </button>
  </div>
)}

                
                    {/* Render Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className=''>
                        <button
                          onClick={() =>
                            setShowReplies(prev => ({ ...prev, [c._id]: !prev[c._id] }))
                          }
                          className='text-white text-xs mb-1 cursor-pointer bg-[#151826] py-1 px-2 rounded-md'
                        >
                          {showReplies[c._id] ? 'Hide Replies' : `View Replies (${c.replies.length})`}
                        </button>
                
                        {showReplies[c._id] && (
                          <div className='mt-1 space-y-1'>
                           {[...c.replies].reverse().map((r, j) => {
                  const replyUserId = typeof r.userId === 'object' ? r.userId._id : r.userId;
                
                  return (
                    <div key={j} className='text-xs text-gray-600 sm:ml-5 flex items-center justify-between bg-[#10121b66] p-2 rounded-md'>
                      <div className='flex items-start justify-center gap-2'>
                         <div>
                      <div className='font-semibold text-white'>
                        {r.name?.firstName || r.userId?.firstName || 'User'} {r.name?.lastName || r.userId?.lastName || ''}
                      </div> 
                      {/* <p className='text-[10px] text-gray-400 ml-1'>
                      </p> */}
                
                      <div className=' text-white'>
                        {r.text}
                      </div>
                      </div>
                
                      <div className='text-white'>
                         {getRelativeTime(r.createdAt)}
                      </div>
                      </div>
                
                      
                      <div>
                        {(id === replyUserId ) && (
                         <button 
  onClick={() => handleDeleteReply(post._id, c._id, r._id)}
  disabled={deleteReplyLoading[r._id]}
  className={`${
    deleteReplyLoading[r._id]
      ? 'bg-gray-700 cursor-not-allowed'
      : 'bg-red-600 hover:bg-red-700'
  } text-white px-2 py-1 rounded-md text-xs ml-2 cursor-pointer transition`}
>
  {deleteReplyLoading[r._id] ? 'Deleting...' : 'Delete'}
</button>
                      )}
                      </div>
                    </div>
                  );
                })}
                
                
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                </div>
                
                                </div>
                            )}      
                              </div>
                            ))
                          ) : (
                            <p className='text-center text-gray-500 col-span-full'>No posts to display.</p>
                          )}
              </div>
            </div>

    </div>
    </>
  )
}

export default Profile
