const express = require("express");
const fs = require("fs").promises;
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt"); // Parol shifrlash
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

// Foydalanuvchilarni o‘qish
const readUsers = async () => {
  try {
    const data = await fs.readFile("users.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Foydalanuvchilarni saqlash
const writeUsers = async (users) => {
  await fs.writeFile("users.json", JSON.stringify(users, null, 2));
};

// Xabarlarni o‘qish
const readMessages = async () => {
  try {
    const data = await fs.readFile("posts.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Xabarlarni saqlash
const writeMessages = async (messages) => {
  await fs.writeFile("posts.json", JSON.stringify(messages, null, 2));
};

// Foydalanuvchilarni olish
app.get("/users", async (req, res) => {
  const users = await readUsers();
  res.json(users.map((user) => ({ id: user.id, name: user.name }))); // Faqat name va id qaytar
});

// Ro‘yxatdan o‘tish (Signup)
app.post("/signup", async (req, res) => {
  const { name, password } = req.body;
  const users = await readUsers();

  // Foydalanuvchi allaqachon mavjudmi tekshirish
  if (users.find((user) => user.name === name)) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Parolni shifrlash
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = {
    id: (users.length + 1).toString(),
    name,
    password: hashedPassword,
  };
  users.push(newUser);
  await writeUsers(users);
  res.json({
    message: "Signup successful",
    user: { id: newUser.id, name: newUser.name },
  });
});

// Kirish (Login)
app.post("/login", async (req, res) => {
  const { name, password } = req.body;
  console.log("Login attempt:", { name, password });
  const users = await readUsers();
  const user = users.find((user) => user.name === name);
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }
  const match = await bcrypt.compare(password, user.password);
  console.log("Password match:", match);
  if (match) {
    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name },
    });
  } else {
    res.status(400).json({ error: "Incorrect password" });
  }
});

// Xabarlarni olish (filtr bilan)
app.get("/messages", async (req, res) => {
  const messages = await readMessages();
  const { sender, receiver } = req.query;

  if (sender && receiver) {
    const filteredMessages = messages.filter(
      (msg) =>
        (msg.sender === sender && msg.receiver === receiver) ||
        (msg.sender === receiver && msg.receiver === sender)
    );
    return res.json(filteredMessages);
  }

  res.json(messages);
});

// Yangi xabar qo‘shish
app.post("/messages", async (req, res) => {
  const messages = await readMessages();
  const newMessage = {
    _id: Date.now().toString(),
    sender: req.body.sender,
    receiver: req.body.receiver,
    content: req.body.content,
    createdAt: new Date(),
  };
  messages.push(newMessage);
  await writeMessages(messages);

  io.emit("newMessage", newMessage);
  res.json(newMessage);
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Shadowgram server running on port ${PORT} with Socket.IO`);
});
