import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { toast, Toaster } from 'react-hot-toast';


const socket = io('https://bondbase.onrender.com', {
  withCredentials: true,
});


const Chat = () => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();
  const [sendLoading, setSendLoading] = useState(false);


  useEffect(() => {
    const id = localStorage.getItem("id");
    if (id) setCurrentUserId(id);
  }, []);

  useEffect(() => {
    axios.get("https://bondbase.onrender.com/api/user/allUsers")
      .then(res => setAllUsers(res.data))
      .catch(err => toast.error(err.response.data.message));
  }, []);

  const selectUser = async (user) => {
    setCurrentChatUser(user);
    try {
      const convo = await axios.post("https://bondbase.onrender.com/api/conversations/", {
        senderId: currentUserId,
        receiverId: user._id,
      });
      setConversationId(convo.data._id);

      const msgs = await axios.get(`https://bondbase.onrender.com/api/messages/${convo.data._id}`);
      setMessages(msgs.data);
    } catch (err) {
      toast.error(err.response.data.message);
    }
  };

 const handleSend = async () => {
  if (!newMessage.trim() || sendLoading) return; // prevent if empty or already sending

  const msg = {
    sender: currentUserId,
    text: newMessage,
    conversationId,
  };

  setSendLoading(true); // start loading

  try {
    const res = await axios.post("https://bondbase.onrender.com/api/messages/", msg);
    const msgWithTime = { ...res.data, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, msgWithTime]);

    socket.emit("sendMessage", {
      ...msgWithTime,
      receiverId: currentChatUser._id,
    });

    setNewMessage("");
  } catch (err) {
    toast.error(err?.response?.data?.message || "Failed to send message");
  } finally {
    setSendLoading(false); // stop loading
  }
};


  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (msg.conversationId === conversationId) {
        if (!msg.createdAt) msg.createdAt = new Date().toISOString();
        setMessages(prev => [...prev, msg]);
      }
    });
    return () => socket.off("receiveMessage");
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (currentUserId) {
      socket.emit("addUser", currentUserId);
    }
  }, [currentUserId]);

  return (
    <>
    <Toaster />
    <div className="w-full h-full flex flex-col items-center justify-center ">
                  <h1 className="text-3xl font-bold text-white text-start mb-3">Chat</h1>

    <div className="flex flex-col sm:flex-row h-[82vh] w-[98%] sm: mx-auto shadow-lg rounded-lg overflow-hidden ">
      {/* User List */}
      <div className="w-full sm:w-[45%] lg:w-1/4 bg-[#10121b66] p-4 border-r overflow-y-auto border-[#71779040] rounded-md ">
        <h3 className="text-xl font-semibold mb-4 text-white">Select Users</h3>
        {allUsers
          .filter(user => user._id !== currentUserId)
          .map(user => (
            <div
              key={user._id}
              onClick={() => selectUser(user)}
         className={`p-3 rounded cursor-pointer font-semibold text-white  bg-[#10121b66] transition-all mb-2 hover:bg-[#10121bdd]  ${
                currentChatUser?._id === user._id ? "bg-[#10121bdd]" : ""
              }`}
            >
              {user.firstName} {user.lastName}
            </div>
          ))}
      </div>

      {/* Chat Area */}
      <div className="flex flex-col sm:w-3/4">
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#10121b66] mt-[20px] sm:mt-0 rounded-md">
          {currentChatUser ? (
            messages.map((msg, idx) => {
              const isOwn = msg.sender === currentUserId;
              return (
                <div
                  key={msg._id || `${msg.sender}-${idx}`}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg shadow ${
                      isOwn
                        ? "bg-[#10121b66] text-white rounded-br-none"
                        : "bg-[#10121b66] text-white rounded-bl-none"
                    }`}
                  >
                    <div className="text-sm">{msg.text}</div>
                    <div className="text-[10px] mt-1 text-right opacity-70">
                      {new Date(msg.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
<div className=" h-[95%] flex items-center justify-center">
  <div className="text-center text-gray-500 text-lg">
    Select a user to start chatting
  </div>
</div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Message Input */}
        {currentChatUser && (
          <div className="p-3 border-t bg-[#10121b66] border-[#71779040] flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 p-2 border border-white placeholder:text-white rounded text-white focus:outline-none focus:ring focus:ring-white"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
           <button
  onClick={handleSend}
  disabled={!conversationId || !newMessage.trim() || sendLoading}
  className={`px-4 py-2 rounded transition ${
    sendLoading || !newMessage.trim()
      ? 'bg-gray-600 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
  } text-white`}
>
  {sendLoading ? "Sending..." : "Send"}
</button>

          </div>
        )}
      </div>
    </div>
    </div>
    </>
  );
};

export default Chat;
