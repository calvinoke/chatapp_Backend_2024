const express = require("express");
const app = express();
const http = require("http").Server(app);
const cors = require("cors");
const mongoose = require('mongoose');
const ChatRoom = require('./models/ChatRoom');
const socketIO = require("socket.io")(http, {
    cors: {
        origin: "http:// 192.168.7.191:8081",
    },
});

require('dotenv').config();

const PORT = 4000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas!!!'))
    .catch((err) => console.error('Could not connect to MongoDB:', err));

const generateID = () => Math.random().toString(36).substring(2, 10);

socketIO.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on('createRoom', async (name) => {
        const newRoom = new ChatRoom({ name, messages: [] });
        await newRoom.save();
        socket.join(newRoom._id.toString());
        const chatRooms = await ChatRoom.find({});
        socket.emit('roomsList', chatRooms);
    });

    socket.on('findRoom', async (id) => {
        const room = await ChatRoom.findById(id);
        if (room) {
            socket.emit('foundRoom', room.messages);
        } else {
            socket.emit('foundRoom', []); // Return an empty array if room not found
        }
    });

    socket.on('newMessage', async (data) => {
        // Log the received data for debugging
        console.log('Received data:', data);

        const { room_id, message, user, timestamp } = data;

        if (!room_id) {
            console.error('No room_id provided in newMessage event');
            return;
        }

        const room = await ChatRoom.findById(room_id);
        if (room) {
            const newMessage = {
                text: message,
                user,
                time: `${timestamp.hour}:${timestamp.mins}`
            };
            room.messages.push(newMessage);
            await room.save();
            socket.to(room._id.toString()).emit('roomMessage', newMessage);
            socket.emit('roomsList', await ChatRoom.find({}));
            socket.emit('foundRoom', room.messages);
        } else {
            console.error(`Room with ID ${room_id} not found`);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔥: A user disconnected');
    });
});


app.get("/api", async (req, res) => {
    const chatRooms = await ChatRoom.find({});
    res.json(chatRooms);
});

http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
