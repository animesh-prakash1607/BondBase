import {React , useState, useEffect} from 'react'
import axios from 'axios'
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import { MdModeEditOutline } from "react-icons/md";
import { FaRegCommentDots } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'; // Install lucide-react for icons
import { toast, Toaster } from 'react-hot-toast';
import {
  LoaderCircle
} from 'lucide-react';
import {
  User,
  Mail,
  ImagePlus,
  PencilLine,
  Info,
  BadgeCheck
} from 'lucide-react';



const Profile = () => { 
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState([]);
  const [id, setId] = useState(''); 
  const [commentInput, setCommentInput] = useState({});
  const [replyInput, setReplyInput] = useState({});
  const [showReplyBox, setShowReplyBox] = useState({});
  const [showReplies, setShowReplies] = useState({});
  const [followers, setFollowers] = useState([]);
const [following, setFollowing] = useState([]);
const [allUsers, setAllUsers] = useState([]);
const [isPrivate, setIsPrivate] = useState(null);
const [edit, setEdit] = useState(false);
const [openMenu, setOpenMenu] = useState({});
const [commentBox, setCommentBox] = useState({});
  const [saving, setSaving] = useState(false);



const toggleMenu = (commentId) => {
  setOpenMenu(prev => ({
    ...prev,
    [commentId]: !prev[commentId]
  }));
};

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
      console.error("Error fetching all users:", error);
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
    console.error("Error following/unfollowing user:", error);
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
      console.error('Error fetching posts:', error);
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
      console.log("main",response.data.user);
      setFollowing(response.data.user.following || []); // ✅ Set following state
      setIsPrivate(response.data.user.privacy);
      setIsPrivate(response.data.user.privacy || 'public');

    } catch (error) {
      console.error('Error fetching user:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
  fetchUser();
}, []);

 const handleDeletePost = async (postId) => {
  console.log("Deleting post with ID:", postId);
  console.log("User ID:", id);
  try {
    await axios.delete(`https://bondbase.onrender.com/api/posts/delete/${postId}/${id}`);
    setFormData(prev => prev.filter(p => p._id !== postId));
  } catch (error) {
    console.error('Error deleting post:', error.response?.data || error.message);
  }
};


const handleDeleteComment = async (postId, commentId) => {
  const id = localStorage.getItem('id');
  if (!id) return console.error("User ID not found in localStorage");

  try {
    console.log("Deleting comment:", postId, commentId, id);
    const response = await axios.delete(
      `https://bondbase.onrender.com/api/posts/delete/comment/${postId}/${commentId}/${id}`
    );

    setFormData(prev =>
      prev.map(p =>
        p._id === postId ? { ...p, comments: response.data.comments } : p
      )
    );
  } catch (error) {
    console.error('Error deleting comment:', error.response?.data || error.message);
  }
};

const handleDeleteReply = async (postId, commentId, replyId) => {
  const id = localStorage.getItem("id");
  if (!id) return;

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
  } catch (error) {
    console.error('Error deleting reply:', error.response?.data || error.message);
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
    console.error("Failed to update privacy:", error);
  }
};

  const handleLike = async (postId) => {
  try {
    const response = await axios.put(`https://bondbase.onrender.com/api/posts/like/${postId}`, { userId: id });
    const updatedPost = response.data;

    // Ensure userId is populated before replacing it in the state
    setFormData(prev =>
      prev.map(p => (p._id === updatedPost._id ? {
        ...updatedPost,
        userId: p.userId  // retain the original populated user object
      } : p))
    );
  } catch (err) {
    console.error(err);
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
    setTimeout(() => {
      setSaving(false);
      toast.success('Profile updated successfully!');
    }, 1500);
  } catch (err) {
    console.error(err);
  }
};

 const handleComment = async (postId) => { 
  if (!commentInput[postId]) return;

  try {
    await axios.post(`https://bondbase.onrender.com/api/posts/comment/${postId}`, {
      userId: id,
      text: commentInput[postId]
    });

    // Re-fetch all posts from your backend
    const allPostsResponse = await axios.get("https://bondbase.onrender.com/api/posts/allPosts");
    setFormData(allPostsResponse.data);
   
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
  } catch (err) {
    console.error(err);
  }
};

  const handleReply = async (postId, commentId) => {
  if (!replyInput[commentId]) return;

  try {
    const response = await axios.post(`https://bondbase.onrender.com/api/posts/reply/${postId}/${commentId}`, {
      userId: id,
      text: replyInput[commentId]
    });

    const updatedPost = response.data;
    console.log(response.data);
    setFormData(prev =>
      prev.map(p => (p._id === updatedPost._id ? updatedPost : p))
    );
    setReplyInput(prev => ({ ...prev, [commentId]: '' }));
    setShowReplyBox(prev => ({ ...prev, [commentId]: false }));
  } catch (err) {
    console.error(err);
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
          <Toaster position="top-center" reverseOrder={false} />

    <div>
      <div className="flex flex-col items-center justify-center mt-15  px-4">
  <h2 className="text-3xl font-bold text-gray-800 mb-8">👤 User Profile</h2>

  {user ? (
    <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg space-y-6">
      {/* Profile Header */}
      <div className="flex justify-between items-center">
        <div className='flex items-center space-x-4'>
           <img
          src={user.profilePhoto || '/default-profile.png'}
          alt={user.firstName}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500"
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{user.firstName} {user.lastName}</h2>
          <p className='text-sm text-gray-500'>{user.title}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        </div>
       
       <div className='mb-5 cursor-pointer transition duration-300 hover:bg-gray-100 p-1 rounded-md' onClick={()=>{setEdit(!edit)}}><MdModeEditOutline size={22} /></div>
      </div>

      {/* Bio */}
      <div className="text-gray-700 mb-4">{user.bio || 'No bio added yet.'}</div>
       <div className='w-full bg-black h-[0.5px] my-2'></div>
      {/* Stats */}
      <div className="flex justify-between text-center text-gray-800 ">
        <div className="flex flex-col items-center justify-center">
          <div className="text-lg font-bold">{user.posts?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-[-5px]">Posts</div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="text-lg font-bold">{user.followers?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-[-5px]">Followers</div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="text-lg font-bold">{user.following?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-[-5px]">Following</div>
        </div>
      </div>
    </div>
  ) : (
    <p className="text-gray-600">Loading...</p>
  )}
</div>

   {edit && (
        <div className="w-[50%] mx-auto bg-white py-4 px-6 rounded-xl shadow-md mt-20">
          <h1 className="text-2xl font-bold text-indigo-600 text-center mb-4">Edit Profile</h1>
          <div className="w-full bg-black h-[0.5px] mb-3"></div>

          <form onSubmit={handleEditProfile} className="flex flex-col items-center justify-center gap-4 w-full">
            {/* Profile Photo */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <ImagePlus size={16} /> Profile Photo
              </label>
              <input
                name="profilePhoto"
                type="file"
                accept="image/*"
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {/* First Name */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <User size={16} /> First Name
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter your first name"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={user.firstName}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
              />
            </div>

            {/* Last Name */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <User size={16} /> Last Name
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter your last name"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={user.lastName}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
              />
            </div>

            {/* Email */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </div>

            {/* Title */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <BadgeCheck size={16} /> Title
              </label>
              <input
                type="text"
                name="title"
                placeholder="Your professional title"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={user.title}
                onChange={(e) => setUser({ ...user, title: e.target.value })}
              />
            </div>

            {/* Bio */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Info size={16} /> Bio
              </label>
              <textarea
                name="bio"
                rows={4}
                placeholder="Tell something about yourself"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={user.bio}
                onChange={(e) => setUser({ ...user, bio: e.target.value })}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition duration-200
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
      

      <div className='w-full max-w-md bg-white p-6 rounded-xl shadow space-y-4 mt-4 mx-auto'>
  <h2 className='text-lg font-bold'>Privacy Settings</h2>
  <div className='flex justify-between items-center'>
      <p>Your profile is currently <strong>{isPrivate}</strong></p>
    <button
      onClick={handlePrivacyToggle}
      className='bg-indigo-500 text-white px-4 py-1 rounded hover:bg-indigo-600 cursor-pointer transition duration-200'
    >
        Make {isPrivate === 'private' ? 'Public' : 'Private'}
    </button>
  </div>
</div>


      <div className='w-full max-w-md bg-white p-6 rounded-xl shadow space-y-4 mt-6 mx-auto'>
  <h2 className='text-lg font-bold'>All Users</h2>
  {user && allUsers.map(otherUser => {
  if (otherUser._id === user._id) return null;

const isFollowing = following.includes(otherUser._id);

    return (
      <div key={otherUser._id} className='flex justify-between items-center border-b py-2'>
        <Link to={`/user/${otherUser._id}`} className='text-blue-600 hover:underline transition duration-300'>
  {otherUser.firstName} {otherUser.lastName}
</Link>

        <button
          onClick={() => handleFollowToggle(otherUser._id)}
          className={`px-3 py-1 text-sm rounded cursor-pointer transition duration-200 ${
            isFollowing ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      </div>
    );
  })}
</div>


      <div className='mt-24 px-6'>
              <h2 className='text-3xl font-semibold text-center mb-8'>Recent Posts</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {formData && formData.length > 0 ? (
                  formData.filter(post => post.userId._id === id).map((post, index) => (
                   <div key={index} className='bg-[#ffffff] px-3 py-2 rounded-xl border-1 border-gray-300 transition'>
                     <div className='flex justify-between items-center '>
                       <div className='flex items-center '>
                                     <img
                                       src={post.userId?.profilePhoto || '/default-profile.png'}
                                       alt='Profile'
                                       className='w-10 h-10 rounded-full mr-3 object-cover'
                                     />
                                     <div>
                                       <p className='font-semibold'>{post.userId?.firstName} {post.userId?.lastName}</p>
                                       <p className='text-sm text-gray-500'>{new Date(post.createdAt).toLocaleString()}</p>
                                     </div>
                                   </div>

                                   <div>
                                    { post.userId._id === id && (
                                        <button
                                          onClick={() => handleDeletePost(post._id)}
                                          className='bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 cursor-pointer  transition duration-200'
                                        >
                                          Delete
                                        </button>
                                    )}
                                   </div>
                     </div>
                                  
                                   <div className='w-full bg-gray-300 h-[0.5px] my-2'></div>
                                   <p className='text-gray-800 mb-3 text-[15px]'>{post.description}</p>
                   
                               {post.images?.length > 0 && (
                     <div className="relative w-[100%] max-w-xl mx-auto">
                       <div className="relative">
                         <img
                           src={post.images[currentImageIndex[post._id] || 0]}
                           alt={`Post ${post._id}`}
                           className="max-h-[500px] bg-gray-100 w-full object-contain rounded-lg"
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
                   
                   
                       <div className='flex justify-between items-center mx-4 text-gray-500'>
                         <div className='text-[13px]'>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</div>
                         <div className='text-[13px]'>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</div>
                       </div>
                   
                            <div className='h-[0.5px] bg-gray-300 mt-2'></div>
                   
                           <div className='flex justify-around items-center mt-3 mb-1'>
                             <div className='flex items-center gap-2'>
                                 <button onClick={() => handleLike(post._id)}>
                                       {post.likes.includes(id) ? (
                                         <FaHeart className='text-red-500 text-xl cursor-pointer' />
                                       ) : (
                                         <FaRegHeart className='text-gray-500 text-xl cursor-pointer' />
                                       )}
                                     </button>
                                     <div>Like</div>
                             </div>
                             <div className='flex items-center gap-2 cursor-pointer' onClick={() =>
  setCommentBox((prev) => ({
    ...prev,
    [post._id]: !prev[post._id],
  }))
}
>
                               <FaRegCommentDots size={20}/>
                               <div>Comment</div>
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
                             {commentBox[post._id] ? 
                             <>
                             <div className='mt-4' >
                               <div className='flex items-center gap-2'>
                                     <input
                                       type='text'
                                       placeholder='Add a comment...'
                                       value={commentInput[post._id] || ''}
                                       onChange={(e) =>
                                         setCommentInput(prev => ({ ...prev, [post._id]: e.target.value }))
                                       }
                                       className='w-full border px-3 py-1 rounded-md'
                                     />
                                     <button
                                       onClick={() => handleComment(post._id)}
                                       className=' bg-blue-500 text-white px-3 py-1 cursor-pointer rounded-md hover:bg-blue-600'
                                     >
                                       Comment
                                     </button>
                                    </div>
                                     <div className='mt-3 max-h-40 overflow-y-auto mx-3'>
                                     <div className='font-semibold text-[12px] text-gray-700 my-1'>Other Comments</div>
                   {post.comments.map((c, i) => (
                     <div key={i} className='mb-2 mx-1 relative'>
                       <div className='text-sm text-gray-700'>
                         <div className='font-semibold flex items-center justify-between'>
                          <div>{c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'User'} </div>  
                       <div className='flex items-center justify-center gap-1'><div className='text-[12px] text-gray-700'>{getRelativeTime(c.createdAt)}</div> <div onClick={()=>toggleMenu(c._id)} className='cursor-pointer hover:bg-gray-100 rounded-full p-1'><BsThreeDots size={16} className=''/></div></div>    
                         </div> 
                         {/*  */}
                       
                       </div>
                       <div className='text-sm text-gray-700 ml-1'>
                       {c.text}  
                       </div>
                   
                       {openMenu[c._id] ?  (
                        <div className=' bg-white border-[0.1px] border-gray-600 w-[100px] h-[60px] flex flex-col justify-center items-center px-3 py-2 absolute top-[-15px] right-10 rounded-md font-semibold shadow-lg gap-2'>
                        { c.userId._id === id && (
                         <button
                           onClick={() => handleDeleteComment(post._id, c._id)}
                           className='text-gray-700 text-xs  cursor-pointer'
                         >
                           Delete
                         </button>
                       )} 
                       <button
                         onClick={() =>
                           setShowReplyBox(prev => ({ ...prev, [c._id]: !prev[c._id] }))
                         }
                         className='text-gray-700 text-xs  cursor-pointer'
                       >
                         {showReplyBox[c._id] ? 'Cancel' : 'Reply'}
                       </button>
                       </div>)
                       : null
                       
                       }  
                       
                       
                   
                       {/* Reply Input */}
                       {showReplyBox[c._id] && (
                         <div className='mt-1 '>
                           <input
                             type='text'
                             placeholder='Write a reply...'
                             value={replyInput[c._id] || ''}
                             onChange={(e) =>
                               setReplyInput(prev => ({ ...prev, [c._id]: e.target.value }))
                             }
                             className='w-full border px-2 py-1 rounded-md text-sm'
                           />
                           <button
                             onClick={() => handleReply(post._id, c._id)}
                             className='mt-1 bg-green-500 text-white px-2 py-1 text-xs cursor-pointer rounded hover:bg-green-600'
                           >
                             Reply
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
                             className='text-indigo-500 text-xs mb-1 cursor-pointer'
                           >
                             {showReplies[c._id] ? 'Hide Replies' : `View Replies (${c.replies.length})`}
                           </button>
                   
                           {showReplies[c._id] && (
                             <div className='mt-1 space-y-1'>
                              {c.replies.map((r, j) => {
                     const replyUserId = typeof r.userId === 'object' ? r.userId._id : r.userId;
                   
                     return (
                       <div key={j} className='text-xs text-gray-600 ml-5 flex items-center justify-between'>
                         <div className='flex items-start justify-center gap-2'>
                            <div>
                         <div className='font-semibold'>
                           {r.name?.firstName || r.userId?.firstName || 'User'} {r.name?.lastName || r.userId?.lastName || ''}
                         </div> 
                         {/* <p className='text-[10px] text-gray-400 ml-1'>
                         </p> */}
                   
                         <div className='ml-1'>
                           {r.text}
                         </div>
                         </div>
                   
                         <div>
                            {getRelativeTime(r.createdAt)}
                         </div>
                         </div>
                   
                         
                         <div>
                           {(id === replyUserId ) && (
                           <button
                             onClick={() => handleDeleteReply(post._id, c._id, r._id)}
                             className='bg-red-600 text-white px-2 py-1 rounded-md text-xs ml-2 cursor-pointer'
                           >
                             Delete
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
                             </> 
                               : null}      
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
