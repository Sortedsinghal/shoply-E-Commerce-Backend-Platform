
import React, { useState, useEffect, useRef } from 'react';

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) setMessages(JSON.parse(savedMessages));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogin = () => {
    if (email && password) {
      const fakeUser = { email };
      localStorage.setItem('user', JSON.stringify(fakeUser));
      setUser(fakeUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const handleSend = async (query = null) => {
    const messageText = query || input;
    if (!messageText.trim()) return;
    const userMsg = { from: 'user', text: messageText, time: getCurrentTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    localStorage.setItem('chatMessages', JSON.stringify(newMessages));
    setInput('');
    setIsTyping(true);
  
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL;

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });
      const data = await response.json();
  
      let formattedReply;
      if (data.reply.startsWith("Here are some matching products:")) {
        const lines = data.reply.split('\n');
        const products = lines.slice(1);
        formattedReply = products.map(p =>
          `<div style="border:1px solid #ccc;padding:8px;border-radius:5px;margin:5px 0;background:#fff;">${p}</div>`
        ).join('');
      } else {
        formattedReply = data.reply;
      }
  
      const botMsg = {
        from: 'bot',
        text: formattedReply,
        time: getCurrentTime(),
        isHTML: true
      };
  
      const updatedMessages = [...newMessages, botMsg];
      setMessages(updatedMessages);
      localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
    } catch (error) {
      alert("Error contacting server. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };
  

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const downloadChat = () => {
    const textContent = messages.map(m => `[${m.time}] ${m.from}: ${m.isHTML ? m.text.replace(/<[^>]+>/g, '') : m.text}`).join('\n\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chat_history.txt';
    a.click();
  };

  if (!user) {
    return (
      <div style={{
        padding: 20,
        maxWidth: '400px',
        margin: '100px auto',
        background: '#f9f9f9',
        borderRadius: '10px',
        boxShadow: '0 0 15px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#333' }}>Login to E-commerce Chatbot</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{
          width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc'
        }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{
          width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #ccc'
        }} />
        <button onClick={handleLogin} style={{
          width: '100%', padding: '10px', background: '#5cb85c', color: 'white',
          border: 'none', borderRadius: '5px', cursor: 'pointer'
        }}>Login</button>
      </div>
    );
  }

  return (
    <div style={{
      padding: 20,
      maxWidth: '600px',
      margin: '40px auto',
      background: '#f5f5f5',
      borderRadius: '10px',
      boxShadow: '0 0 15px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>
        Welcome, {user.email}
        <button onClick={handleLogout} style={{
          marginLeft: '10px',
          background: '#d9534f',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>Logout</button>
      </h2>

      <div style={{ marginBottom: 10 }}>
        <button onClick={() => {
          setMessages([]);
          localStorage.removeItem('chatMessages');
        }} style={{
          background: '#f0ad4e',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '5px',
          cursor: 'pointer',
          marginRight: 10
        }}>Reset Chat</button>

        <button onClick={() => handleSend('books')} style={{ marginRight: 5 }}>📚 Books</button>
        <button onClick={() => handleSend('electronics')} style={{ marginRight: 5 }}>🔌 Electronics</button>
        <button onClick={() => handleSend('show all')} style={{ marginRight: 5 }}>🛍️ All</button>
        <button onClick={downloadChat} style={{ marginLeft: 5 }}>📥 Export Chat</button>
      </div>

      <div style={{
        height: '300px',
        overflowY: 'scroll',
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        marginBottom: '10px'
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: '10px',
            padding: '8px',
            backgroundColor: msg.from === 'user' ? '#d9edf7' : '#dff0d8',
            borderRadius: '5px'
          }}>
            <b>{msg.from}</b> [{msg.time}]:<br />
            {msg.isHTML ? (
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
            ) : (
              msg.text
            )}
          </div>
        ))}
        {isTyping && <div><i>Bot is typing...</i></div>}
        <div ref={chatEndRef}></div>
      </div>

      <div style={{ display: 'flex' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px 0 0 5px'
          }}
        />
        <button onClick={() => handleSend()} style={{
          padding: '10px 20px',
          background: '#5cb85c',
          color: 'white',
          border: 'none',
          borderRadius: '0 5px 5px 0',
          cursor: 'pointer'
        }}>Send</button>
      </div>
    </div>
  );
}

export default App;