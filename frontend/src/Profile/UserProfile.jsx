import React, { useEffect, useState , useRef} from 'react'; 
import { useParams } from 'react-router-dom';
import axios from 'axios';
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
  BadgeCheck,
  Eye
} from 'lucide-react';

const UserProfile = () => {
 const [user, setUser] = useState(null);
   const [formData, setFormData] = useState([]);
   const {id} = useParams();
    const [visitorId, setVisitorId] = useState(null);
   const [profile, setProfile] = useState(null);
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
   const menuRefs = useRef({});
   const toggleRefs = useRef({});
   const commentBoxRefs = useRef({});
   const commentToggleRefs = useRef({});
   
   
   
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
     const id = localStorage.getItem('id');
     setVisitorId(id);
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
 
 useEffect(() => { const fetchProfile = async () => {
   try { const response = await axios.post( "https://bondbase.onrender.com/api/user/id", { id },
     { headers:
       { Authorization: `Bearer ${localStorage.getItem("token")}`, }
       } );
       console.log(response.data.user);
        setProfile(response.data.user);
       } catch (error) 
       { toast.error(error.response.data.message); } 
      }; fetchProfile(); }, [id]);

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
   try {
     await axios.delete(`https://bondbase.onrender.com/api/posts/delete/${postId}/${id}`);
     setFormData(prev => prev.filter(p => p._id !== postId));
   } catch (error) {
     toast.error(error.response.data.message);
   }
 };
 
 
 const handleDeleteComment = async (postId, commentId) => {
   const id = localStorage.getItem('id');
   if (!id) return console.error("User ID not found in localStorage");
 
   try {
     const response = await axios.delete(
       `https://bondbase.onrender.com/api/posts/delete/comment/${postId}/${commentId}/${id}`
     );
 
     setFormData(prev =>
       prev.map(p =>
         p._id === postId ? { ...p, comments: response.data.comments } : p
       )
     );
   } catch (error) {
     toast.error(error.response.data.message);
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
     toast.error(error.response.data.message);
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
     toast.error(err.response.data.message);
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
     toast.error(err.response.data.message);
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
     setFormData(prev =>
       prev.map(p => (p._id === updatedPost._id ? updatedPost : p))
     );
     setReplyInput(prev => ({ ...prev, [commentId]: '' }));
     setShowReplyBox(prev => ({ ...prev, [commentId]: false }));
   } catch (err) {
     toast.error(err.response.data.message);
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
       <div className="flex flex-col items-center justify-center mt-8 px-4 ">
   <h2 className="text-3xl font-bold text-white mb-8">User Profile</h2>
 
   {user && !edit  ? (
     <div className="w-full  bg-[#10121b66] p-6 rounded-2xl shadow-lg space-y-6">
       {/* Profile Header */}
       <div className="flex justify-between items-center border-b-[1px] pb-6 border-[#71779040]">
         <div className='flex items-center space-x-7'>
            <img
           src={profile.profilePhoto || '/default-profile.png'}
           alt={profile.firstName}
           className="w-20 h-20 rounded-full object-cover hover:scale-110 transition-all ring-2 ring-[#10121b66]"
         />
         <div>
           <h2 className="text-3xl font-semibold text-white">{profile.firstName} {profile.lastName}</h2>
           <p className='text-xl text-gray-400'>{profile.title}</p>
           {/* <p className="text-sm text-gray-500">{profile.email}</p> */}
         </div>
         </div>
        
       
       </div>
 
       <div className='bg-[#10121b66] p-2 rounded-md'>
       <div className='flex  justify-between  p-2 rounded-md'>
         <div className='flex items-center gap-1'>
           <h3 className='text-white text-[18px] font-semibold'>Email :</h3>
           <div className='text-gray-200 text-[17px]'>{profile.email}</div>
         </div>
         <div className='flex items-center gap-1'>
           <h3 className='text-white text-[18px] font-semibold'>Privacy :</h3>
           <div className='text-gray-200 text-[17px] '>{isPrivate.charAt(0).toUpperCase() + isPrivate.slice(1)}</div>
         </div>
       </div>
 
       {/* Bio */}
       <div className="text-gray-200 mb-4  p-3 rounded-md">
         <h3 className="text-lg font-semibold  text-white">Bio:</h3>
         {profile.bio || 'No bio added yet.'}
         </div>
       </div>
 
        <div className='w-full bg-[#10121b66] text-white p-6 rounded-xl shadow space-y-1 mt-4 mx-auto'>
   <h2 className='text-lg font-bold'>Privacy</h2>
   <div className='flex justify-between items-center'>
       <p>This profile is currently <strong>{isPrivate}</strong></p>
    
   </div>
 </div>
 
       {/* Stats */}
       <div className="flex justify-between text-center text-white ">
         <div className="flex flex-col items-center justify-center bg-[#10121b66] w-[100px] pt-1 pb-2 rounded-md transition-transform hover:scale-110 duration-300">
           <div className="text-lg font-bold">{profile.posts?.length || 0}</div>
           <div className="text-sm text-white mt-[-5px]">Posts</div>
         </div>
         <div className="flex flex-col items-center justify-center bg-[#10121b66] w-[100px] pt-1 pb-2 rounded-md transition-transform hover:scale-110 duration-300">
           <div className="text-lg font-bold">{profile.followers?.length || 0}</div>
           <div className="text-sm text-white mt-[-5px]">Followers</div>
         </div>
         <div className="flex flex-col items-center justify-center bg-[#10121b66] w-[100px] pt-1 pb-2 rounded-md transition-transform hover:scale-110 duration-300">
           <div className="text-lg font-bold">{profile.following?.length || 0}</div>
           <div className="text-sm text-white mt-[-5px]">Following</div>
         </div>
       </div>
 
       
     </div>
   ) : !edit ? (
     <p className="text-gray-600">Loading...</p>
   ): null}
 </div>
 
 
 
     {(profile?.privacy ==='public' || profile?.followers?.includes(visitorId)) ? (
      <div className='mt-16 mb-10 px-6'>
               <h2 className='text-3xl font-bold text-center mb-8 text-white'>User Posts</h2>
               <div className='grid grid-cols-1 md:grid-cols-2  gap-6'>
                    {formData && formData.length > 0 ? (
                 formData
                   .filter(post => 
                   post?.userId?._id === id  
                   ).map((post, index) => (
                               <div key={index} className='bg-[#10121b66] px-8 py-5 rounded-xl transition'>
                                 <div className='flex justify-between items-center'>
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
                               <button onClick={() => handleLike(post._id)}>
                                     {post.likes.includes(id) ? (
                                       <FaHeart className='text-white text-xl cursor-pointer' />
                                     ) : (
                                       <FaRegHeart className='text-white text-xl cursor-pointer' />
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
                                     className=' bg-blue-500 text-white px-3 py-1 cursor-pointer rounded-md hover:bg-blue-600'
                                   >
                                     Comment
                                   </button>
                                  </div>
                                   <div className='mt-3 max-h-40 overflow-y-auto mx-3'>
                                   <div className='font-semibold text-[12px] text-white my-1'>{post.comments.length === 0 ? 'No comments yet' : 'Comments'}</div>
                 {[...post.comments].reverse().map((c, i) => (
                   <div key={i} className='mb-2 mx-1 relative bg-[#15182666] p-2 rounded-md'>
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
                      { c.userId._id === visitorId  && (
                       <button
                         onClick={() => handleDeleteComment(post._id, c._id)}
                         className='text-xs cursor-pointer bg-red-500 px-3 py-1 rounded-md hover:bg-red-600'
                       >
                         Delete
                       </button>
                     )} 
                     <button
                       onClick={() =>
                         setShowReplyBox(prev => ({ ...prev, [c._id]: !prev[c._id] }))
                       }
                       className=' text-xs cursor-pointer bg-green-500 w-[60px] py-1 rounded-md hover:bg-green-600'
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
                           className='w-full border text-white placeholder:text-gray-300 mt-1 placeholder:hover:border-0 px-2 py-1 rounded-md text-sm border-white placeholder:border-white'
                         />
                         <button
                           onClick={() => handleReply(post._id, c._id)}
                           className='my-1 bg-green-500 text-white px-2 py-1 text-xs cursor-pointer rounded hover:bg-green-600'
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
                           className='text-white text-xs mb-1 cursor-pointer bg-[#151826] py-1 px-2 rounded-md'
                         >
                           {showReplies[c._id] ? 'Hide Replies' : `View Replies (${c.replies.length})`}
                         </button>
                 
                         {showReplies[c._id] && (
                           <div className='mt-1 space-y-1'>
                            {[...c.replies].reverse().map((r, j) => {
                   const replyUserId = typeof r.userId === 'object' ? r.userId._id : r.userId;
                 
                   return (
                     <div key={j} className='text-xs text-gray-600 ml-5 flex items-center justify-between bg-[#10121b66] p-2 rounded-md'>
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
                         {(id === replyUserId && post.userId._id !== id) && (
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
                             )}      
                               </div>
                             ))
                           ) : (
                             <p className='text-center text-gray-500 col-span-full'>No posts to display.</p>
                           )}
               </div>
             </div>
       ):<div className='text-3xl text-white font-semibold text-center my-10'>
       This Account is Private
       </div>}  
 
     </div>
     </>
   )
};

export default UserProfile;
