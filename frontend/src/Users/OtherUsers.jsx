import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const OtherUsers = () => {
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
     try {
       const response = await axios.get('http://localhost:3000/api/user/allUsers',
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
     await axios.put(`http://localhost:3000/api/user/follow/${targetUserId}`, {
       currentUserId: id,
     });
 
     // Refetch user data to sync
     const updatedUser = await axios.post("http://localhost:3000/api/user/id", { id });
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
       const response = await axios.get('http://localhost:3000/api/posts/allPosts');
       setFormData(response.data);
     } catch (error) {
       toast.error(error.response.data.message);
     }
   };
 
   fetchData();
 
   // Socket.io connection
   const socket = io('http://localhost:3000', {
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
       const response = await axios.post("http://localhost:3000/api/user/id", 
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

  return (
    <>
    <Toaster />
   <div className="p-2 sm:p-6 mt-10 w-full mx-auto">
  <h2 className="text-3xl font-bold text-white text-center mb-6">All Users</h2>

  <div className="bg-[#10121b41] p-2 sm:p-4 rounded-xl shadow space-y-3">
    {user &&
      allUsers.map((otherUser) => {
        if (otherUser._id === user._id) return null;

        const isFollowing = following.includes(otherUser._id);

        return (
          <div
            key={otherUser._id}
            className="flex items-center justify-between bg-[#1a1c2b] hover:bg-[#222436] transition-all duration-200 rounded-xl px-2 sm:px-4 py-3"
          >
            {/* Avatar + Name */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full shadow-sm">
                {otherUser.firstName.charAt(0).toUpperCase()}
              </div>
              <Link
                to={`/user/${otherUser._id}`}
                className="text-white font-medium hover:underline hover:text-blue-400"
              >
                {otherUser.firstName} {otherUser.lastName}
              </Link>
            </div>

            {/* Follow/Unfollow Button */}
            <div>
              <button
              onClick={() => handleFollowToggle(otherUser._id)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition duration-200 ${
                isFollowing
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
            </div>
            
          </div>
        );
      })}
  </div>
</div>
</>
  );
};

export default OtherUsers;
