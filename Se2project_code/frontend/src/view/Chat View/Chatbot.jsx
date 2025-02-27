import React, { useState } from 'react';
import axios from 'axios';

const Chatbot = ({ pdfId, pdfContent, onClose, syllabus }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendMessage = async () => {
    if (userInput.trim()) {
      const newMessages = [...messages, { sender: 'user', text: userInput }];
      setMessages(newMessages);
      setUserInput('');
      setLoading(true);
      setError(null);

      try {
        const payload = { message: userInput, pdfId, pdfContent };
        console.log("[DEBUG] Sending payload to backend:", payload);

        const response = await axios.post(
          'http://localhost:5000/chatbot/chat_with_pdf',
          payload,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          const botResponse = response.data.response.replace(/\n/g, '<br />') || 'No response from the bot.';
          console.log("[DEBUG] Bot response received:", botResponse);

          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: 'bot', text: botResponse },
          ]);
        } else {
          setError(response.data.error || 'Failed to get a valid response.');
          alert('Failed to get a valid response from the chatbot. Please try again.');
        }
      } catch (error) {
        console.error('[ERROR] Network error:', error.response?.data || error.message);
        if (error.response?.status === 404) {
          setError('Endpoint not found (404). Please check the backend route.');
        } else if (error.code === 'ERR_NETWORK') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError('An unexpected error occurred.');
        }
        alert('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.chatContainer}>
        <div style={styles.header}>
          <h5 style={styles.title}>
            Chat with PDF: {syllabus?.syllabus_description || 'Untitled'}
          </h5>
          <button style={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div style={styles.chatBody}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={msg.sender === 'user' ? styles.userMessage : styles.botMessage}
              dangerouslySetInnerHTML={{ __html: msg.text }} 
            />
          ))}
          {loading && <div style={styles.loadingMessage}>Bot is typing...</div>}
          {error && <div style={styles.errorMessage}>{error}</div>}
        </div>
        <div style={styles.inputContainer}>
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            style={styles.input}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            style={styles.sendButton}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  chatContainer: {
    backgroundColor: '#fff',
    width: '95%',
    maxWidth: '1000px',
    height: '90%',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    padding: '25px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #ddd',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '2rem',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2.5rem',
    cursor: 'pointer',
    color: '#333',
  },
  chatBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '15px 20px',
    borderRadius: '25px',
    maxWidth: '75%',
    textAlign: 'right',
    fontSize: '1.2rem',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    color: '#333',
    padding: '15px 20px',
    borderRadius: '25px',
    maxWidth: '75%',
    textAlign: 'left',
    fontSize: '1.2rem',
  },
  loadingMessage: {
    alignSelf: 'center',
    color: '#555',
    fontStyle: 'italic',
    fontSize: '1.1rem',
  },
  errorMessage: {
    alignSelf: 'center',
    color: '#d9534f',
    fontStyle: 'italic',
    fontSize: '1.1rem',
  },
  inputContainer: {
    display: 'flex',
    marginTop: '20px',
    borderTop: '1px solid #ddd',
    paddingTop: '20px',
  },
  input: {
    flex: 1,
    padding: '20px',
    fontSize: '1.2rem',
    borderRadius: '15px',
    border: '1px solid #ddd',
    marginRight: '20px',
  },
  sendButton: {
    padding: '20px 30px',
    fontSize: '1.2rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    boxShadow: '0 5px 15px rgba(0, 123, 255, 0.4)',
    transition: 'background-color 0.3s',
  },
};

export default Chatbot;
