import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sender, setSender] = useState(
    localStorage.getItem("currentUser") || ""
  ); // localStorage'dan olish
  const [receiver, setReceiver] = useState("");
  const [users, setUsers] = useState([]);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("currentUser")
  ); // localStorage'dan tekshirish
  const socket = io("http://localhost:5000");

  // Foydalanuvchilarni olish
  useEffect(() => {
    axios
      .get("http://localhost:5000/users")
      .then((response) => setUsers(response.data))
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  // Login
  const handleLogin = () => {
    const trimmedName = loginName.trim();
    const trimmedPassword = loginPassword.trim();
    axios
      .post("http://localhost:5000/login", {
        name: trimmedName,
        password: trimmedPassword,
      })
      .then((response) => {
        setSender(trimmedName);
        setIsLoggedIn(true);
        localStorage.setItem("currentUser", trimmedName); // localStorage'ga saqlash
        setError("");
      })
      .catch((error) =>
        setError(error.response?.data?.error || "Login failed")
      );
  };

  // Signup
  const handleSignup = () => {
    const trimmedName = signupName.trim();
    const trimmedPassword = signupPassword.trim();
    axios
      .post("http://localhost:5000/signup", {
        name: trimmedName,
        password: trimmedPassword,
      })
      .then((response) => {
        setLoginName(trimmedName);
        setLoginPassword(trimmedPassword);
        handleLogin(); // Avtomatik login
      })
      .catch((error) =>
        setError(error.response?.data?.error || "Signup failed")
      );
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setSender("");
    setReceiver("");
    setMessages([]);
    localStorage.removeItem("currentUser"); // localStorage'dan o'chirish
  };

  // Xabarlarni olish
  useEffect(() => {
    if (sender && receiver && isLoggedIn) {
      axios
        .get(
          `http://localhost:5000/messages?sender=${sender}&receiver=${receiver}`
        )
        .then((response) => setMessages(response.data))
        .catch((error) => console.error("Error fetching messages:", error));

      socket.on("newMessage", (message) => {
        if (
          (message.sender === sender && message.receiver === receiver) ||
          (message.sender === receiver && message.receiver === sender)
        ) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      });
    }

    return () => socket.disconnect();
  }, [sender, receiver, isLoggedIn, socket]);

  // Yangi xabar yuborish
  const handleSendMessage = () => {
    if (newMessage.trim() === "" || !sender || !receiver || !isLoggedIn) return;

    axios
      .post("http://localhost:5000/messages", {
        sender: sender,
        receiver: receiver,
        content: newMessage,
      })
      .then((response) => {
        setNewMessage("");
      })
      .catch((error) => console.error("Error sending message:", error));
  };

  if (!isLoggedIn) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Shadowgramm Login
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Username"
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogin}
            fullWidth
          >
            Login
          </Button>
        </Box>
        <Typography variant="h6" align="center">
          Or Signup
        </Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="New Username"
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSignup}
            fullWidth
          >
            Signup
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="App">
      <Typography variant="h3" align="center" gutterBottom>
        Shadowgramm Chat - Logged in as: {sender}{" "}
        {/* Foydalanuvchi nomini ko'rsatish */}
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          color="error"
          onClick={handleLogout}
          fullWidth
        >
          Logout
        </Button>
        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
          <InputLabel>Chat with</InputLabel>
          <Select
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            label="Chat with"
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.name}>
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box className="message-form" sx={{ mb: 4 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write a message..."
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          fullWidth
        >
          Send
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom>
        Messages
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {messages.map((msg) => (
        <Box
          key={msg._id}
          sx={{
            display: "flex",
            justifyContent: msg.sender === sender ? "flex-end" : "flex-start",
            mb: 2,
          }}
        >
          <Card
            sx={{
              maxWidth: "60%",
              backgroundColor: msg.sender === sender ? "#e3f2fd" : "#f5f5f5",
            }}
          >
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary">
                {msg.sender} to {msg.receiver}
              </Typography>
              <Typography variant="body1">{msg.content}</Typography>
              <Typography variant="caption" color="textSecondary">
                {new Date(msg.createdAt).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Container>
  );
}

export default App;
