import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("https://tvgv5n-8080.csb.app");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [activeRooms, setActiveRooms] = useState([]);
  const [userList, setUserList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState([]);

  useEffect(() => {
    socket.on("activeRooms", (rooms) => {
      setActiveRooms(rooms);
    });

    socket.on("userList", (users) => {
      setUserList(users);
    });

    socket.on("chatMessage", (data) => {
      const { username, message: text } = data;
      const newMessage = { username, text };
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("activeRooms");
      socket.off("userList");
    };
  }, []);

  const handleJoinRoom = (e) => {
    e.preventDefault();
    socket.emit("joinRoom", { roomName: room, username });
  };
  const handleLeaveRoom = () => {
    socket.emit("leaveRoom");
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (message.trim() !== "") {
      // Emit the `chatMessage` event to the server
      socket.emit("chatMessage", { room, text: message });
      setMessage("");
    }
  };

  return (
    <div className="App" style={{ textAlign: "center" }}>
      <h1>Main App</h1>
      <div>
        <form
          onSubmit={handleJoinRoom}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <select value={room} onChange={(e) => setRoom(e.target.value)}>
            <option value="">Select a room</option>
            {activeRooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
          <button type="submit">Join Room</button>
        </form>
        <button onClick={handleLeaveRoom}>Leave Room</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <h1>Create New Room</h1>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter new Room name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={handleJoinRoom}>create Room</button>
      </div>

      <div className="chat-room">
        <div className="message-list">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <span className="username">{msg.username}: 
                <span className="text">{msg.text}</span>
              </span>
            </div>
          ))}
        </div>
        <form className="message-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>

      {/* <div>
        <h2>Active Users</h2>
        <ul>
          {userList.map((user) => (
            <li key={user}>{user}</li>
          ))}
        </ul>
      </div> */}
    </div>
  );
}

export default App;
