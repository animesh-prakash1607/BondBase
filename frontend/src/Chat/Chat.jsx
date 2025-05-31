import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io("https://bondbase.onrender.com");

const Chat = () => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    const id = localStorage.getItem("id");
    if (id) setCurrentUserId(id);
  }, []);

  useEffect(() => {
    axios.get("https://bondbase.onrender.com/api/user/allUsers")
      .then(res => setAllUsers(res.data))
      .catch(err => console.error("User fetch error", err));
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
      console.error("Chat load error", err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const msg = {
      sender: currentUserId,
      text: newMessage,
      conversationId,
    };

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
      console.error("Message send error", err);
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
    <div className="flex h-[80vh] my-10 shadow-lg rounded-lg overflow-hidden">
      {/* User List */}
      <div className="w-1/4 bg-gray-100 p-4 border-r overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Select Users</h3>
        {allUsers
          .filter(user => user._id !== currentUserId)
          .map(user => (
            <div
              key={user._id}
              onClick={() => selectUser(user)}
              className={`p-3 rounded cursor-pointer mb-2 bg-gray-300 hover:bg-gray-200 ${
                currentChatUser?._id === user._id ? "bg-gray-300" : ""
              }`}
            >
              {user.firstName} {user.lastName}
            </div>
          ))}
      </div>

      {/* Chat Area */}
      <div className="flex flex-col w-3/4">
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
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
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-900 rounded-bl-none"
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
<div className="h-[95%] flex items-center justify-center">
  <div className="text-center text-gray-500 text-lg">
    Select a user to start chatting
  </div>
</div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Message Input */}
        {currentChatUser && (
          <div className="p-3 border-t bg-gray-50 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded focus:outline-none focus:ring focus:ring-blue-200"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              onClick={handleSend}
              disabled={!conversationId || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
