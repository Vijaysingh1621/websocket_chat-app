"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User } from "lucide-react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userName, setUserName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserName(savedName);
      setIsNameSet(true);
    }
  }, []);

  useEffect(() => {
    if (isNameSet) {
      const ws = new WebSocket("ws://localhost:8080");
      ws.onopen = () => {
        setIsConnecting(false);
        ws.send(JSON.stringify({ type: "join", userName }));
      };
      ws.onmessage = async (event) => {
        const data = JSON.parse(await event.data.text());

        if (data.type === "message" && data.userName !== userName) {
          // Only show messages from other users
          const newMessage = { text: data.message, sender: "server", userName: data.userName };
          setMessages((prev) => {
            const updatedMessages = [...prev, newMessage];
            localStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
            return updatedMessages;
          });
        }
      };
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
      };
      ws.onclose = (event) => {
        console.log("WebSocket connection closed:", event);
        setIsConnecting(true);
      };
      setSocket(ws);
      return () => ws.close();
    }
  }, [isNameSet, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && socket) {
      socket.send(JSON.stringify({ type: "message", message: input, userName }));
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSetName = () => {
    if (userName.trim()) {
      setIsNameSet(true);
      localStorage.setItem("userName", userName);
    }
  };

  if (!isNameSet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Enter Your Name</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSetName()}
              placeholder="Your name"
              className="flex-1 border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSetName}
              className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden flex-1 flex flex-col">
        <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Beautiful Chat</h1>
          <span className="text-gray-600">Welcome, {userName}!</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  msg.sender === "user" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.sender === "server" && <span className="font-bold">{msg.userName}: </span>}
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2">
            <textarea
              className="flex-1 border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
            />
            <button
              onClick={sendMessage}
              disabled={isConnecting}
              className={`p-2 rounded-full ${
                isConnecting ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600"
              } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
