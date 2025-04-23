const db = require('../models');
const roomHandler = require('./room');
const { sendSystemMessage } = require('./utils');

let onlineUsers = [];

module.exports = function (io) {
  io.on('connection', async (socket) => {

    socket.on('user_connected', async (userData) => {
      const rawIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
      const ip = rawIp.includes("::ffff:") ? rawIp.split("::ffff:")[1] : rawIp;
      const fp = userData.fp || '';


      let userWithData;

      if (userData.type === 'عضو') {
        const user = await db.User.findOne({ where: { idreg: userData.id } });
        if (!user) return;

        await db.User.update({ ip, fp, lastssen: new Date().toISOString() }, { where: { idreg: user.idreg } });

        userWithData = {
          socketId: socket.id,
          id: user.idreg,
          name: user.username,
          type: 'عضو',
          profilePicture: user.pic ? `/uploads/avatars/${user.pic}` : '/uploads/default-avatar.png',
          message: user.msg || '',
          topic: user.topic || '',
          bg: user.bg || '#FFFFFF',
          mcol: user.mcol || '#000000',
          ucol: user.ucol || '#000000',
          power: user.power || '',
          evaluation: user.evaluation || 0,
          groupid: user.groupid || null,
          rep: user.rep || 0,
          room: userData.room || 'room_1'
        };

      } else {
        await db.Guest.update({ ip, fp, lastssen: new Date().toISOString() }, { where: { id: userData.id } });

        userWithData = {
          socketId: socket.id,
          id: userData.id,
          name: userData.name,
          type: 'زائر',
          profilePicture: userData.pic ? `/uploads/avatars/${userData.pic}` : '/uploads/default-avatar.png',
          message: '',
          room: userData.room || 'room_1'
        };
      }

      const alreadyExists = onlineUsers.some(u =>
        u.id === userWithData.id &&
        u.room === userWithData.room &&
        u.type === userWithData.type
      );

      if (!alreadyExists) {
        socket.join(userWithData.room);
        onlineUsers.push(userWithData);
        socket.data.userInfo = userWithData;

        const dbRoom = await db.Room.findByPk(parseInt(userWithData.room.replace("room_", "")));
        const roomName = dbRoom ? dbRoom.topic : "غرفة غير معروفة";

        sendSystemMessage(io, userWithData.room, userWithData, "join", roomName);
      }

      const usersInRoom = onlineUsers.filter(u => u.room === userWithData.room);
      io.to(userWithData.room).emit("update_user_list", usersInRoom);
      io.emit("update_user_list", onlineUsers);
    });

    socket.on("send_message", (data) => {
      const sender = socket.data.userInfo;
      if (!sender || !data.room || !data.message) return;

      const messagePayload = {
        username: sender.topic || sender.name,
        message: data.message,
        profilePicture: sender.profilePicture || '/uploads/default-avatar.png',
        fontColor: sender.mcol || "#222222",
        fontSize: data.fontSize || "16px",
        fontStyle: data.fontStyle || "normal",
        timestamp: new Date().toISOString(),
        nameColor: sender.ucol || "#000000",
        nameBg: sender.bg || "transparent"
      };

      io.to(data.room).emit("new_message", messagePayload);
    });

    socket.on("disconnect", async () => {
      const disconnectedUser = socket.data.userInfo;
      if (!disconnectedUser) return;

      onlineUsers = onlineUsers.filter(u => u.socketId !== socket.id);

      if (disconnectedUser.room) {
        const usersInRoom = onlineUsers.filter(u => u.room === disconnectedUser.room);
        io.to(disconnectedUser.room).emit("update_user_list", usersInRoom);
      }

      io.emit("update_user_list", onlineUsers);

      const roomName = disconnectedUser.room
        ? (await db.Room.findByPk(parseInt(disconnectedUser.room.replace("room_", ""))))?.topic || "غرفة غير معروفة"
        : "الدردشة";

      const eventType = disconnectedUser.room ? "leave_chat" : "leave";

      sendSystemMessage(io, disconnectedUser.room || "main_lobby", disconnectedUser, eventType, roomName);
    });

    socket.on("leave_room", async ({ room, username }) => {
      const user = socket.data.userInfo;
      if (!user) return;

      const index = onlineUsers.findIndex(u => u.socketId === socket.id);
      if (index !== -1) {
        onlineUsers[index].room = null;
        socket.data.userInfo.room = null;
      }

      const usersInRoom = onlineUsers.filter(u => u.room === room);
      io.to(room).emit("update_user_list", usersInRoom);
      io.emit("update_user_list", onlineUsers);

      const dbRoom = await db.Room.findByPk(parseInt(room.replace("room_", "")));
      const roomName = dbRoom ? dbRoom.topic : "غرفة غير معروفة";

      sendSystemMessage(io, room, user, "leave_room", roomName);
      socket.leave(room);
    });

    roomHandler(io, socket, {
      io, socket,
      getOnlineUsers: () => onlineUsers,
      setOnlineUsers: (val) => { onlineUsers = val; }
    });
  });
};
