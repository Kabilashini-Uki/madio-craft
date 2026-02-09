import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

const Chat = ({ roomId, artisanId, productId }) => {
  const [message, setMessage] = useState('');
  const { 
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    messages, 
    createRoom,
    activeRoom 
  } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    const initializeChat = async () => {
      if (roomId) {
        joinRoom(roomId);
      } else if (artisanId && productId) {
        const newRoom = await createRoom(artisanId, productId);
        if (newRoom) {
          joinRoom(newRoom._id);
        }
      }
    };

    initializeChat();

    return () => {
      leaveRoom();
    };
  }, [roomId, artisanId, productId, joinRoom, leaveRoom, createRoom]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.sender === user?._id ? 'sent' : 'received'}`}
          >
            <p>{msg.message}</p>
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!activeRoom}
        />
        <button type="submit" disabled={!message.trim() || !activeRoom}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;