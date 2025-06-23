// components/LiveChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import EmojiPicker from 'emoji-picker-react'; // Import the library

function LiveChat({ hidden }) {
  const { socket, roomId, myUsername, myAvatar, participants } = useGameStore();
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State for emoji picker visibility
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null); // Ref for emoji picker to handle clicks outside
  const emojiButtonRef = useRef(null); // Ref for the emoji button

  // Handler for when an emoji is clicked from the EmojiPicker component
  const onEmojiClick = (emojiObject) => {
    setMessageInput((prevInput) => prevInput + emojiObject.emoji);
    // Optionally close the picker after selection.
    // For a smoother user experience, you might want to keep it open unless
    // the user explicitly closes it or sends a message.
    // setShowEmojiPicker(false);
  };

  // Helper to get participant's avatar for display
  const getParticipantAvatar = (socketId) => {
    const participant = participants.find(p => p.socketId === socketId);
    const avatarStyle = participant?.avatar?.head || 'bottts';
    const avatarSeed = participant?.username || 'default-seed';
    return `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc,a6e3d9&radius=50`;
  };


  // Scroll to bottom of chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Socket.IO message handling
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chatMessage', handleNewMessage);

    return () => {
      socket.off('chatMessage', handleNewMessage);
    };
  }, [socket, roomId]);

  // Close emoji picker when clicking outside or on the emoji button itself
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() === '' || !socket || !roomId) return;

    const messageData = {
      roomId,
      senderId: socket.id,
      senderName: myUsername,
      senderAvatar: myAvatar, // Send the avatar data directly
      text: messageInput.trim(),
      timestamp: Date.now(),
    };

    socket.emit('chatMessage', messageData);
    setMessageInput(''); // Clear input after sending
    setShowEmojiPicker(false); // Close emoji picker after sending message
  };

  return (
    <>
      <h2 className={`text-2xl font-semibold text-blue-300 mb-4 flex items-center ${hidden ? 'hidden' : ''}`}>
        Live Chat <span className="ml-2 text-lg text-gray-400">💬</span>
      </h2>
      {/* Main Chat Container - Updated rounded-lg to rounded-xl for slightly more curve */}
      <div className="h-64 overflow-y-auto pr-2 mb-4 custom-scrollbar rounded-xl snowy-outline">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center italic mt-10">No messages yet. Say hello!</p>
        ) : (
          <div className="space-y-2 py-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start ${msg?.senderId === socket?.id ? 'justify-end' : 'justify-start'}`}
              >
                {msg.senderId !== socket.id && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 mr-2 border-2 border-blue-400">
                    <img
                      src={getParticipantAvatar(msg.senderId)}
                      alt={`${msg.senderName}'s avatar`}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32x32/333333/FFFFFF?text=ERR"; }}
                    />
                  </div>
                )}
                <div className={`flex flex-col px-3 py-1.5 rounded-xl max-w-[90%] md:max-w-[75%] ${
                  msg.senderId === socket.id
                    ? 'bg-blue-600 text-white rounded-br-none self-end'
                    : 'bg-gray-600 text-gray-100 rounded-bl-none self-start'
                }`}>
                  <span className="font-semibold text-sm mb-0.5">{msg.senderId === socket.id ? 'You' : msg.senderName}</span>
                  <p className="text-sm break-words">{msg.text}</p>
                  <span className="text-xs text-right mt-0.5 opacity-75">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.senderId === socket.id && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 ml-2 border-2 border-blue-400">
                    <img
                      src={getParticipantAvatar(msg.senderId)}
                      alt={`${msg.senderName}'s avatar`}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/32x32/333333/FFFFFF?text=ERR"; }}
                    />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* For auto-scrolling */}
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2 relative">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="bg-gray-600 text-white px-3 py-1.5 text-lg rounded-md font-semibold hover:bg-gray-700 transition"
          title="Toggle Emoji Picker"
          ref={emojiButtonRef}
        >
          😀
        </button>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          maxLength={300}
          className="flex-1 px-3 py-1.5 text-sm bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-1.5 text-sm rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50"
          disabled={messageInput.trim() === ''}
        >
          Send
        </button>

        {/* Emoji Picker Section - Absolute positioning for popup behavior */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            // You might want to adjust the width and appearance of the picker
            // to better suit the 'emoji-picker-react' library's default styling
            // or provide a theme prop to the picker itself.
            // For now, keeping the same container styling for consistency.
            className="absolute bottom-full mb-2 left-0 w-full shadow-lg z-20"
          >
            {/* Replace the hardcoded emoji grid with the EmojiPicker component */}
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            {/* You can customize the EmojiPicker further with props like:
                theme="dark" (or "light", "auto")
                skinTonePickerLocation="PREVIEW" (or "SEARCH")
                emojiVersion={14}
                height={350}
                width="100%"
                searchDisabled={false}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled={false}
                // ... and many more, refer to its documentation
            */}
          </div>
        )}
      </form>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151; /* gray-700 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563; /* gray-600 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280; /* gray-500 */
        }

        /* Snowy White Outline for the chat container */
        .snowy-outline {
          border: 2px solid rgba(255, 255, 255, 0.7); /* Soft white border */
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.5), /* Wider, softer glow */
                      inset 0 0 8px rgba(255, 255, 255, 0.3); /* Inner glow for depth */
        }
      `}</style>
    </>
  );
}

export default LiveChat;