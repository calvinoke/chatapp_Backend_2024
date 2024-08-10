const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: String,
    user: String,
    time: String
});

const chatRoomSchema = new mongoose.Schema({
    name: String,
    messages: [messageSchema]
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
