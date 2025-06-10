import axios from 'axios';
import {React, useState,useEffect, useRef} from 'react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { FaRegCommentDots } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { Link } from 'react-router-dom';
import { IoHome } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import { IoChatboxEllipsesSharp } from "react-icons/io5";
import { MdLocalPostOffice } from "react-icons/md";
import { FaWindowClose } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { toast, Toaster } from 'react-hot-toast';


const Home = () => {
  const [formData, setFormData] = useState([]);
  const [error, setError] = useState('');
  const [id, setId] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [replyInput, setReplyInput] = useState({});
const [showReplyBox, setShowReplyBox] = useState(null); // holds active commentId or null
const [showReplies, setShowReplies] = useState({});
const [user , setUser] = useState([]);
const [commentBox, setCommentBox] = useState({});
const [openMenu, setOpenMenu] = useState({});
const menuRefs = useRef({});
const toggleRefs = useRef({});
const commentBoxRefs = useRef({});
const commentToggleRefs = useRef({});
const [commentLoading, setCommentLoading] = useState({});
const [deleteCommentLoading, setDeleteCommentLoading] = useState({});
const [replyLoading, setReplyLoading] = useState({});
const [deleteReplyLoading, setDeleteReplyLoading] = useState({});
const [likeLoading, setLikeLoading] = useState({});




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
const nextImage = (postId, images) => {
  setCurrentImageIndex((prev) => ({
    ...prev,
    [postId]: (prev[postId] + 1) % images.length,
  }));
};

const prevImage = (postId, images) => {
  setCurrentImageIndex((prev) => ({
    ...prev,
    [postId]: (prev[postId] - 1 + images.length) % images.length,
  }));
};

    useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');

      try {
        const response = await axios.get('https://bondbase.onrender.com/api/user/allUsers',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUser(response.data);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    };
    fetchUser();
  }, []);

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


  const handleDeletePost = async (postId) => {
  try {
    await axios.delete(`https://bondbase.onrender.com/api/posts/${postId}`, {
      data: { userId: id }
    });
    setFormData(prev => prev.filter(p => p._id !== postId));
  } catch (error) {
    toast.error(error.response.data.message);
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

  

  return (
    <>
    <Toaster />
    <div className='mb-5'>
    <div className='text-[rgb(17,24,39)]  min-h-screen  py-5'>
      {/* Hero Section */}
      {/* <section className='mt-20 text-center px-4'>
        <h1 className='text-5xl font-bold'>BondBase</h1>
        <p className='text-md mt-2 text-[#989c9f] font-medium'>Beyond Posts. Build Presence.</p>
        <p className='mt-6 text-lg max-w-2xl mx-auto'>
          Where ideas meet people. BondBase lets you share, connect, and grow in a space built for creators, thinkers, and everyday voices.
        </p>
      </section> */}

      
 <div className=''>
        {/* <h2 className='text-3xl font-semibold text-center mb-8'>Recent Posts</h2> */}
        <div className='flex flex-col lg:w-[45vw] md:w-[60vw] w-[78vw] m-auto gap-6'>

         {(() => {
  const filteredPosts = formData
    ? formData.filter(post =>
        post?.userId?._id !== id &&
        (post?.userId?.privacy === "public" || post.userId?.followers.includes(id))
      ).reverse()
    : [];

  if (filteredPosts.length === 0) {
    return (
      <p className='text-center text-white z-50 col-span-full mt-10'>No posts to display.</p>
    );
  }

  return (
    <>
      <h1 className='text-3xl font-bold mt-2  sm:mb-5 text-center text-white'>Home Feed</h1>
      {filteredPosts.reverse().map((post) => (
        <div key={post._id} className='bg-[#10121b66] px-5 sm:px-8 py-5 rounded-xl transition mb-6'>
          {/* Post Header */}
          <div className='flex items-center mb-4'>
            <img
              src={post.userId?.profilePhoto || '/default-profile.png'}
              alt='Profile'
              className='w-10 h-10 rounded-full mr-3 object-cover'
            />
            <div>
              <Link to={`/user/${post.userId?._id}`}>
                <p className='font-semibold hover:underline transition-all duration-200 text-white'>
                  {post.userId?.firstName} {post.userId?.lastName}
                </p>
              </Link>
              <p className='text-sm text-gray-300'>{new Date(post.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Post Image Carousel */}
          {post.images?.length > 0 && (
            <div className="relative w-full max-w-xl mx-auto">
              <div className="relative mt-4">
                <img
                  src={post.images[currentImageIndex[post._id] || 0]}
                  alt={`Post ${post._id}`}
                  className="max-h-[500px] w-full bg-[#10121b66] object-contain rounded-lg"
                />
              </div>
              <div className="flex justify-center gap-2 mt-2">
                {post.images.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 w-2 rounded-full cursor-pointer ${
                      (currentImageIndex[post._id] || 0) === index ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    onClick={() =>
                      setCurrentImageIndex((prev) => ({ ...prev, [post._id]: index }))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <p className='text-white font-semibold my-3 text-[15px]'>{post.description}</p>

          {/* Like and Comment Counts */}
          <div className='flex justify-between items-center text-white text-[13px]'>
            <div>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</div>
            <div>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</div>
          </div>

          <div className='h-[0.5px] bg-gray-500 mt-2'></div>

          {/* Like and Comment Buttons */}
          <div className='flex justify-between items-center mt-2'>
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

            <div
              className='flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-[#10121b66]'
              onClick={() => setCommentBox(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
              ref={(el) => {
                if (el) commentToggleRefs.current[post._id] = el;
                else delete commentToggleRefs.current[post._id];
              }}
            >
              <FaRegCommentDots size={20} className='text-white' />
              <div className='text-white'>Comment</div>
            </div>
          </div>

          {/* Comment Box */}
          {commentBox[post._id] && (
            <div className='mt-4' ref={(el) => {
              if (el) commentBoxRefs.current[post._id] = el;
              else delete commentBoxRefs.current[post._id];
            }}>
              <div className='flex items-center gap-2 flex-col sm:flex-row'>
                <input
                  type='text'
                  placeholder='Add a comment...'
                  value={commentInput[post._id] || ''}
                  onChange={(e) => setCommentInput(prev => ({ ...prev, [post._id]: e.target.value }))}
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

              <div className='mt-3 max-h-40 overflow-y-auto sm:mx-3'>
                <div className='font-semibold text-[12px] text-white my-1'>
                  {post.comments.length === 0 ? 'No comments yet' : 'Comments'}
                </div>

                {[...post.comments].reverse().map((c, i) => (
                  <div key={i} className='mb-2 sm:mx-1 relative bg-[#15182666] p-2 rounded-md'>
                    {/* Comment Header */}
                    <div className='text-sm text-white'>
                      <div className='font-semibold flex items-center justify-between'>
                        <div>{c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'User'}</div>
                        <div className='flex items-center gap-1'>
                          <div className='text-[12px] text-white'>{getRelativeTime(c.createdAt)}</div>
                          <div
                            ref={(el) => {
                              if (el) toggleRefs.current[c._id] = el;
                              else delete toggleRefs.current[c._id];
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(c._id);
                            }}
                            className='cursor-pointer hover:bg-[#10121b66] rounded-full p-1'
                          >
                            <BsThreeDots size={16} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='text-sm text-gray-300'>{c.text}</div>

                    {/* Dropdown Menu */}
                    {openMenu[c._id] && (
                      <div
                        ref={(el) => {
                          if (el) menuRefs.current[c._id] = el;
                          else delete menuRefs.current[c._id];
                        }}
                        className='bg-[#15182666] text-white px-2 py-2 flex flex-col items-center absolute top-[-15px] right-10 rounded-md font-semibold shadow-lg gap-2'
                      >
                        {c.userId._id === id && (
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

                      </div>
                    )}

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
                      <div>
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
                                  <div className='flex items-start gap-2'>
                                    <div>
                                      <div className='font-semibold text-white'>
                                        {r.name?.firstName || r.userId?.firstName || 'User'} {r.name?.lastName || r.userId?.lastName || ''}
                                      </div>
                                      <div className='text-white'>{r.text}</div>
                                    </div>
                                    <div className='text-white'>{getRelativeTime(r.createdAt)}</div>
                                  </div>

                                  <div>
                                    {(id === replyUserId && post.userId._id !== id) && (
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
      ))}
    </>
  );
})()}

        </div>
      </div>



     
    </div>
    
    </div>
    </>
  );
};

export default Home;

//   <div className='w-[70%] overflow-y-scroll  h-[90%] mx-auto'>
//        {formData && formData.length > 0 ? (
// formData
//   .filter(post => 
//   post?.userId?._id !== id 
//    &&
//      (
//      post?.userId?.privacy === "public" ||                       //remember to uncomment this
//        post.userId?.followers.includes(id)
//      )
//   )
//   .reverse().map((post, index) => (
//               <div key={index} className='bg-[#10121b66] px-3 py-2 rounded-xl hover:bg-[#1e1b42] transition'>
//                 <div className='flex items-center '>
//                   <img
//                     src={post.userId?.profilePhoto || '/default-profile.png'}
//                     alt='Profile'
//                     className='w-10 h-10 rounded-full mr-3 object-cover'
//                   />
//                   <div>
//                     <Link to={`/user/${post.userId?._id}`}><p className='font-semibold hover:underline transition-all duration-200 text-white'>{post.userId?.firstName} {post.userId?.lastName}</p></Link>
//                     <p className='text-sm text-gray-500'>{new Date(post.createdAt).toLocaleString()}</p>
//                   </div>
//                 </div>
//                 <div className='w-full bg-gray-300 h-[0.5px] my-2'></div>
//                 <p className='text-white mb-3 text-[15px] '>{post.description}</p>

//             {post.images?.length > 0 && (
//   <div className="relative w-[100%] max-w-xl mx-auto">
//     <div className="relative">
//       <img
//         src={post.images[currentImageIndex[post._id] || 0]}
//         alt={`Post ${post._id}`}
//         className="max-h-[500px] bg-[#10121b] w-full object-contain rounded-lg"
//       />
//       {/* {post.images.length > 1 && (
//         <>
//           <button
//             onClick={() => prevImage(post._id, post.images)}
//             className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full"
//           >
//             ‹
//           </button>
//           <button
//             onClick={() => nextImage(post._id, post.images)}
//             className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full"
//           >
//             ›
//           </button>
//         </>
//       )} */}
//     </div>

//     {/* Dots Navigation */}
//     <div className="flex justify-center gap-2 mt-2">
//       {post.images.map((_, index) => (
//         <button
//           key={index}
//           className={`h-2 w-2 rounded-full cursor-pointer ${
//             (currentImageIndex[post._id] || 0) === index
//               ? 'bg-blue-500'
//               : 'bg-gray-300'
//           }`}
//           onClick={() =>
//             setCurrentImageIndex((prev) => ({
//               ...prev,
//               [post._id]: index,
//             }))
//           }
//         />
//       ))}
//     </div>
//   </div>
// )}


//     <div className='flex justify-between items-center mx-4 text-gray-400'>
//       <div className='text-[13px]'>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</div>
//       <div className='text-[13px]'>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</div>
//     </div>

//          <div className='h-[0.5px] bg-gray-300 mt-2'></div>

//         <div className='flex justify-around items-center mt-3 mb-1'>
//           <div className='flex items-center gap-2'>
//               <button onClick={() => handleLike(post._id)}>
//                     {post.likes.includes(id) ? (
//                       <FaHeart className='text-red-500 text-xl cursor-pointer' />
//                     ) : (
//                       <FaRegHeart className='text-gray-500 text-xl cursor-pointer' />
//                     )}
//                   </button>
//                   <div className='text-[#8f9394]'>Like</div>
//           </div>
//           <div className='flex items-center gap-2 cursor-pointer' onClick={() =>
//   setCommentBox((prev) => ({
//     ...prev,
//     [post._id]: !prev[post._id],
//   }))
// }
// >
//             <FaRegCommentDots size={20} className='text-[#8f9394]' />
//             <div className='text-[#8f9394]'>Comment</div>
//           </div>

//         </div>
//                 {/* Like Button */}
//                 {/* <div className='mt-4 flex items-center gap-3'>
//                   <button onClick={() => handleLike(post._id)}>
//                     {post.likes.includes(id) ? (
//                       <FaHeart className='text-red-500 text-xl cursor-pointer' />
//                     ) : (
//                       <FaRegHeart className='text-gray-500 text-xl cursor-pointer' />
//                     )}
//                   </button>
//                   <span>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</span>
//                 </div> */}

//                 {/* Comments */}
//           {commentBox[post._id] && (
//           <div className='mt-4' >
//             <div className='flex items-center gap-2'>
//                   <input
//                     type='text'
//                     placeholder='Add a comment...'
//                     value={commentInput[post._id] || ''}
//                     onChange={(e) =>
//                       setCommentInput(prev => ({ ...prev, [post._id]: e.target.value }))
//                     }
//                     className='w-full border px-3 py-1 rounded-md'
//                   />
//                   <button
//                     onClick={() => handleComment(post._id)}
//                     className=' bg-blue-500 text-white px-3 py-1 cursor-pointer rounded-md hover:bg-blue-600'
//                   >
//                     Comment
//                   </button>
//                  </div>
//                   <div className='mt-3 max-h-40 overflow-y-auto mx-3'>
//                   <div className='font-semibold text-[12px] text-gray-700 my-1'>{post.comments.length === 0 ? 'No comments yet' : 'Comments'}</div>
// {[...post.comments].reverse().map((c, i) => (
//   <div key={i} className='mb-2 mx-1 relative'>
//     <div className='text-sm text-gray-700'>
//       <div className='font-semibold flex items-center justify-between'>
//        <div>{c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'User'} </div>  
//     <div className='flex items-center justify-center gap-1'><div className='text-[12px] text-gray-700'>{getRelativeTime(c.createdAt)}</div> <div onClick={()=>toggleMenu(c._id)} className='cursor-pointer hover:bg-gray-100 rounded-full p-1'><BsThreeDots size={16} className=''/></div></div>    
//       </div> 
//       {/*  */}
    
//     </div>
//     <div className='text-sm text-gray-700 ml-1'>
//     {c.text}  
//     </div>

//     {openMenu[c._id] ?  (
//      <div className=' bg-white border-[0.1px] border-gray-600 w-[100px] h-[60px] flex flex-col justify-center items-center px-3 py-2 absolute top-[-15px] right-10 rounded-md font-semibold shadow-lg gap-2'>
//      { c.userId._id === id  && (
//       <button
//         onClick={() => handleDeleteComment(post._id, c._id)}
//         className='text-gray-700 text-xs  cursor-pointer'
//       >
//         Delete
//       </button>
//     )} 
//     <button
//       onClick={() =>
//         setShowReplyBox(prev => ({ ...prev, [c._id]: !prev[c._id] }))
//       }
//       className='text-gray-700 text-xs  cursor-pointer'
//     >
//       {showReplyBox[c._id] ? 'Cancel' : 'Reply'}
//     </button>
//     </div>)
//     : null
    
//     }  
    
    

//     {/* Reply Input */}
//     {showReplyBox[c._id] && (
//       <div className='mt-1 '>
//         <input
//           type='text'
//           placeholder='Write a reply...'
//           value={replyInput[c._id] || ''}
//           onChange={(e) =>
//             setReplyInput(prev => ({ ...prev, [c._id]: e.target.value }))
//           }
//           className='w-full border px-2 py-1 rounded-md text-sm'
//         />
//         <button
//           onClick={() => handleReply(post._id, c._id)}
//           className='mt-1 bg-green-500 text-white px-2 py-1 text-xs cursor-pointer rounded hover:bg-green-600'
//         >
//           Reply
//         </button>
//       </div>
//     )}

//     {/* Render Replies */}
//     {c.replies && c.replies.length > 0 && (
//       <div className=''>
//         <button
//           onClick={() =>
//             setShowReplies(prev => ({ ...prev, [c._id]: !prev[c._id] }))
//           }
//           className='text-indigo-500 text-xs mb-1 cursor-pointer'
//         >
//           {showReplies[c._id] ? 'Hide Replies' : `View Replies (${c.replies.length})`}
//         </button>

//         {showReplies[c._id] && (
//           <div className='mt-1 space-y-1'>
//            {[...c.replies].reverse().map((r, j) => {
//   const replyUserId = typeof r.userId === 'object' ? r.userId._id : r.userId;

//   return (
//     <div key={j} className='text-xs text-gray-600 ml-5 flex items-center justify-between'>
//       <div className='flex items-start justify-center gap-2'>
//          <div>
//       <div className='font-semibold'>
//         {r.name?.firstName || r.userId?.firstName || 'User'} {r.name?.lastName || r.userId?.lastName || ''}
//       </div> 
//       {/* <p className='text-[10px] text-gray-400 ml-1'>
//       </p> */}

//       <div className='ml-1'>
//         {r.text}
//       </div>
//       </div>

//       <div>
//          {getRelativeTime(r.createdAt)}
//       </div>
//       </div>

      
//       <div>
//         {(id === replyUserId && post.userId._id !== id) && (
//         <button
//           onClick={() => handleDeleteReply(post._id, c._id, r._id)}
//           className='bg-red-600 text-white px-2 py-1 rounded-md text-xs ml-2 cursor-pointer'
//         >
//           Delete
//         </button>
//       )}
//       </div>
//     </div>
//   );
// })}


//           </div>
//         )}
//       </div>
//     )}
//   </div>
// ))}

// </div>

//                 </div>
//             )}      
//               </div>
//             ))
//           ) : (
//             <p className='text-center text-gray-500 col-span-full'>No posts to display.</p>
//           )}
//       </div>




// <div>
//                                 <h1 className='text-3xl font-bold  mt-2 mb-5 text-center text-white'>Home Feed</h1>
//               <div key={index} className='bg-[#10121b66] px-8 py-5 rounded-xl transition'>
                
//                 <div className='flex items-center '>
//                   <img
//                     src={post.userId?.profilePhoto || '/default-profile.png'}
//                     alt='Profile'
//                     className='w-10 h-10 rounded-full mr-3 object-cover'
//                   />
//                   <div>
//                     <Link to={`/user/${post.userId?._id}`}><p className='font-semibold hover:underline transition-all duration-200 text-white'>{post.userId?.firstName} {post.userId?.lastName}</p></Link>
//                     <p className='text-sm text-gray-300'>{new Date(post.createdAt).toLocaleString()}</p>
//                   </div>
//                 </div>

//             {post.images?.length > 0 && (
//   <div className="relative w-[100%] max-w-xl mx-auto">
//     <div className="relative mt-4">
//       <img
//         src={post.images[currentImageIndex[post._id] || 0]}
//         alt={`Post ${post._id}`}
//         className="max-h-[500px] bg-[#10121b66] w-full object-contain rounded-lg"
//       />
     
//     </div>

//     <div className="flex justify-center gap-2 mt-2">
//       {post.images.map((_, index) => (
//         <button
//           key={index}
//           className={`h-2 w-2 rounded-full cursor-pointer ${
//             (currentImageIndex[post._id] || 0) === index
//               ? 'bg-blue-500'
//               : 'bg-gray-300'
//           }`}
//           onClick={() =>
//             setCurrentImageIndex((prev) => ({
//               ...prev,
//               [post._id]: index,
//             }))
//           }
//         />
//       ))}
//     </div>
//   </div>
// )}

//       <p className='text-white font-semibold my-3 text-[15px] '>{post.description}</p>

//     <div className='flex justify-between items-center  text-white'>
//       <div className='text-[13px]'>{post.likes.length} {post.likes.length === 1 ? 'Like' : 'Likes'}</div>
//       <div className='text-[13px]'>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</div>
//     </div>

//          <div className='h-[0.5px] bg-gray-500 mt-2'></div>

//         <div className='flex justify-between items-center mt-2 mb-[-8px]'>
//           <div className='flex items-center gap-2'>
//               <button onClick={() => handleLike(post._id)}>
//                     {post.likes.includes(id) ? (
//                       <FaHeart className='text-white text-xl cursor-pointer' />
//                     ) : (
//                       <FaRegHeart className='text-white text-xl cursor-pointer' />
//                     )}
//                   </button>
//                   <div className='text-white'>Like</div>
//           </div>
//           <div className='flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-[#10121b66]' onClick={() =>
//     setCommentBox((prev) => ({
//       ...prev,
//       [post._id]: !prev[post._id],
//     }))
//   }
//   ref={(el) => {
//     if (el) commentToggleRefs.current[post._id] = el;
//     else delete commentToggleRefs.current[post._id];
//   }}
// >
//              <FaRegCommentDots size={20} className='text-white'/>
//             <div className='text-white '>Comment</div>
//           </div>

//         </div>
                
//           {commentBox[post._id] && (
//           <div className='mt-4' 
//           ref={(el) => {
//       if (el) commentBoxRefs.current[post._id] = el;
//       else delete commentBoxRefs.current[post._id];
//     }}
//           >
//             <div className='flex items-center gap-2'>
//                   <input
//                     type='text'
//                     placeholder='Add a comment...'
//                     value={commentInput[post._id] || ''}
//                     onChange={(e) =>
//                       setCommentInput(prev => ({ ...prev, [post._id]: e.target.value }))
//                     }
//                     className='w-full border px-3 py-1 rounded-md text-white'
//                   />
//                   <button
//                     onClick={() => handleComment(post._id)}
//                     className=' bg-blue-500 text-white px-3 py-1 cursor-pointer rounded-md hover:bg-blue-600'
//                   >
//                     Comment
//                   </button>
//                  </div>
//                   <div className='mt-3 max-h-40 overflow-y-auto mx-3'>
//                   <div className='font-semibold text-[12px] text-white my-1'>{post.comments.length === 0 ? 'No comments yet' : 'Comments'}</div>
// {[...post.comments].reverse().map((c, i) => (
//   <div key={i} className='mb-2 mx-1 relative bg-[#15182666] p-2 rounded-md'>
//     <div className='text-sm text-white '>
//       <div className='font-semibold flex items-center justify-between'>
//        <div>{c.userId ? `${c.userId.firstName} ${c.userId.lastName}` : 'User'} </div>  
//     <div className='flex items-center justify-center gap-1'><div className='text-[12px] text-white'>{getRelativeTime(c.createdAt)}</div> <div  ref={(el) => {
//     if (el) toggleRefs.current[c._id] = el;
//     else delete toggleRefs.current[c._id];
//   }}
//   onClick={(e) => {
//     e.stopPropagation();
//     toggleMenu(c._id);
//   }} className='cursor-pointer hover:bg-[#10121b66] rounded-full p-1'><BsThreeDots size={16} className=''/></div></div>    
//       </div> 
//       {/*  */}
    
//     </div>
//     <div className='text-sm text-gray-300 '>
//     {c.text}  
//     </div>

//    {openMenu[c._id] && (
//   <div
//   ref={(el) => {
//       if (el) menuRefs.current[c._id] = el;
//       else delete menuRefs.current[c._id];
//     }}
//     className='bg-[#15182666]  text-white px-2 py-2 flex flex-col justify-center items-center absolute top-[-15px] right-10 rounded-md font-semibold shadow-lg gap-2'
//   >
//     {c.userId._id === id && (
//       <button
//         onClick={() => handleDeleteComment(post._id, c._id)}
//         className='text-xs cursor-pointer bg-red-500 px-3 py-1 rounded-md hover:bg-red-600'
//       >
//         Delete
//       </button>
//     )}
//     <button
//       onClick={() =>
//         setShowReplyBox((prev) => ({ ...prev, [c._id]: !prev[c._id] }))
//       }
//       className='text-xs cursor-pointer bg-green-500 w-[60px] py-1 rounded-md hover:bg-green-600'
    
//     >
//       {showReplyBox[c._id] ? 'Cancel' : 'Reply'}
//     </button>
//   </div>
// )}

    

//     {showReplyBox[c._id] && (
//       <div className='mt-1 '>
//         <input
//           type='text'
//           placeholder='Write a reply...'
//           value={replyInput[c._id] || ''}
//           onChange={(e) =>
//             setReplyInput(prev => ({ ...prev, [c._id]: e.target.value }))
//           }
//           className='w-full border  text-white mt-1 placeholder:hover:border-0 px-2 py-1 rounded-md text-sm border-white placeholder:border-white'
//         />
//         <button
//           onClick={() => handleReply(post._id, c._id)}
//           className='my-1 bg-green-500 text-white px-2 py-1 text-xs cursor-pointer rounded hover:bg-green-600'
//         >
//           Reply
//         </button>
//       </div>
//     )}

//     {/* Render Replies */}
//     {c.replies && c.replies.length > 0 && (
//       <div className=''>
//         <button
//           onClick={() =>
//             setShowReplies(prev => ({ ...prev, [c._id]: !prev[c._id] }))
//           }
//           className='text-white text-xs mb-1 cursor-pointer bg-[#151826] py-1 px-2 rounded-md'
//         >
//           {showReplies[c._id] ? 'Hide Replies' : `View Replies (${c.replies.length})`}
//         </button>

//         {showReplies[c._id] && (
//           <div className='mt-1 space-y-1'>
//            {[...c.replies].reverse().map((r, j) => {
//   const replyUserId = typeof r.userId === 'object' ? r.userId._id : r.userId;

//   return (
//     <div key={j} className='text-xs text-gray-600 ml-5 flex items-center justify-between bg-[#10121b66] p-2 rounded-md'>
//       <div className='flex items-start justify-center gap-2'>
//          <div>
//       <div className='font-semibold text-white'>
//         {r.name?.firstName || r.userId?.firstName || 'User'} {r.name?.lastName || r.userId?.lastName || ''}
//       </div> 
//       <div className=' text-white'>
//         {r.text}
//       </div>
//       </div>

//       <div className='text-white'>
//          {getRelativeTime(r.createdAt)}
//       </div>
//       </div>

      
//       <div>
//         {(id === replyUserId && post.userId._id !== id) && (
//         <button
//           onClick={() => handleDeleteReply(post._id, c._id, r._id)}
//           className='bg-red-600 text-white px-2 py-1 rounded-md text-xs ml-2 cursor-pointer'
//         >
//           Delete
//         </button>
//       )}
//       </div>
//     </div>
//   );
// })}


//           </div>
//         )}
//       </div>
//     )}
//   </div>
// ))}

// </div>

//                 </div>
//             )}      
//               </div>
//               </div>