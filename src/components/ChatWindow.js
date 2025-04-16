import React, { useState, useEffect, useRef } from "react";
import "./ChatWindow.css";
import { getAIMessage, resetChatHistory, defaultMessage} from "../api/api";
import { marked } from "marked";

function ChatWindow() {

  const [messages,setMessages] = useState([defaultMessage])
  const [input, setInput] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  const handleSend = async (input) => {
    if (input.trim() !== "") {
      // Set user message
      setMessages(prevMessages => [...prevMessages, { role: "user", content: input }]);
      setInput("");
      
      //Temporary thinking message
      const loadingMessage = { role: "assistant", content: "One moment, finding the best info for you..." };
      setMessages(prev => [...prev, loadingMessage]);

      try {
        const aiResponse = await getAIMessage(input);
  
        setMessages(prev => [
          ...prev.slice(0, -1), // remove last message (the loading one)
          aiResponse
        ]);
      } catch (error) {
        console.error("Error getting AI response:", error);
  
        setMessages(prev => [
          ...prev.slice(0, -1), // remove the loading message
          { role: "assistant", content: "Oops! Something went wrong." }
        ]);
      }
      }
  };
  const handleReset = () => {
    setMessages([defaultMessage]);
    setInput("");
    resetChatHistory();
  };

  // // TODO: Load chat history when the page reloads
  // window.onload = () => {
  //   const stored = localStorage.getItem('chatHistory');
  //   chatHistory = stored ? JSON.parse(stored) : [];

  //   chatHistory.forEach(setMessages);
  // };


  return (
    <div className="messages-container">
      {messages.map((message, index) => (
        <div key={index} className={`${message.role}-message-container`}>
          {message.content && (
            <div className={`message ${message.role}-message`}>
              <div
                dangerouslySetInnerHTML={{
                  __html: marked(message.content).replace(/<p>|<\/p>/g, ""),
                }}
              ></div>
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
  
      <div style={{ textAlign: "center", margin: "1rem 0" }}>
        <button
          className="reset-button"
          onClick={handleReset}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: "#eee",
            border: "1px solid #ccc",
          }}
        >
          Reset Chat
        </button>
      </div>
  
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              handleSend(input);
              e.preventDefault();
            }
          }}
          rows="3"
        />
        <button className="send-button" onClick={() => handleSend(input)}>
          Send
        </button>
      </div>
    </div>
  );

}

export default ChatWindow;
