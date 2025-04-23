// 📁 sockets/room.js

const db = require('../models');
const { sendSystemMessage } = require('./utils');





module.exports = function (io, socket, shared) {
  const { getOnlineUsers, setOnlineUsers } = shared;

  // ✅ جلب الغرف وعدد المتواجدين
  socket.on("get_rooms", async () => {
    try {
      const rooms = await db.Room.findAll({
        attributes: ['idroom', 'topic', 'about', 'pic', 'max']
      });

      const roomCounts = {};
      getOnlineUsers().forEach(user => {
        if (user.room) {
          roomCounts[user.room] = (roomCounts[user.room] || 0) + 1;
        }
      });

      const roomsWithCounts = rooms.map(room => {
        const roomKey = `room_${room.idroom}`;
        return {
          ...room.dataValues,
          currentCount: roomCounts[roomKey] || 0
        };
      });

      socket.emit("room_list", roomsWithCounts);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  });

  function extractRoomId(room) {
    if (typeof room === 'string') {
      if (room.includes("room_")) {
        return parseInt(room.replace("room_", ""));
      } else if (!isNaN(parseInt(room))) {
        return parseInt(room);
      }
    } else if (typeof room === 'number') {
      return room;
    }
    return 1;
  }

  async function notifyRoom(room, username, action) {
    const roomId = extractRoomId(room);
    const dbRoom = await db.Room.findByPk(roomId);
    const roomName = dbRoom ? dbRoom.topic : `Room (${roomId})`;

    io.to(room).emit('notification', `
      <div class="room-notify">
        <span>${username} ${action}</span>
        <span class="room-tag">${roomName}</span>
      </div>
    `);
  }

// ✅ انضمام للغرفة
socket.on('join_room', async ({ room, username }) => {
  socket.join(room);
  try {
    // ✅ جلب اسم الغرفة الحقيقي من قاعدة البيانات
    const roomId = parseInt(room.replace("room_", ""));
    const dbRoom = await db.Room.findByPk(roomId);
    const roomTopic = dbRoom ? dbRoom.topic : `Room (${roomId})`;

    // ✨ إرسال رسالة انضمام جميلة بنفس تنسيق الرسائل العامة
    const user = socket.data?.userInfo;
    if (user) {
      sendSystemMessage(io, room, user, "join", roomTopic);
    }

    const usersInRoom = getOnlineUsers().filter(u => u.room === room);
    io.to(room).emit("update_user_list", usersInRoom);
    io.emit("update_user_list", getOnlineUsers()); // 🔁 تحديث الكل
    io.emit("refresh_rooms"); // 🔁 تحديث عداد الغرف
  } catch (err) {
    console.error("❌ join_room error:", err.message);
  }
});

// ✅ تغيير الغرفة
socket.on('change_room', async ({ oldRoom, newRoom, username }) => {
  try {
    const user = getOnlineUsers().find(u => u.socketId === socket.id);
    if (user) user.room = newRoom;
    if (socket.data.userInfo) socket.data.userInfo.room = newRoom;

    socket.leave(oldRoom);
    socket.join(newRoom);
    socket.emit("room_changed", newRoom);

    const usersInOldRoom = getOnlineUsers().filter(u => u.room === oldRoom);
    const usersInNewRoom = getOnlineUsers().filter(u => u.room === newRoom);

    io.to(oldRoom).emit("update_user_list", usersInOldRoom);
    io.to(newRoom).emit("update_user_list", usersInNewRoom);

    const parsedRoomId = parseInt(newRoom.replace("room_", ""));
    const dbRoom = await db.Room.findByPk(parsedRoomId);
    const roomName = dbRoom ? dbRoom.topic : `Room (${parsedRoomId})`;
    const roomIdFormatted = `room_${parsedRoomId}`; // ✅ الصيغة الصحيحة للـ data-room

    const userInfo = socket.data?.userInfo;

    if (userInfo) {
      sendSystemMessage(io, oldRoom, userInfo, "switch", roomName, roomIdFormatted);
      sendSystemMessage(io, newRoom, userInfo, "join", roomName, roomIdFormatted);
    }

    io.emit("update_user_list", getOnlineUsers());
    io.emit("refresh_rooms");

  } catch (err) {
    console.error("❌ change_room error:", err.message);
  }
});


  // ✅ التحقق من كلمة مرور الغرفة
  socket.on('check_room_password', async ({ roomId, pass }, callback) => {
    const room = await db.Room.findByPk(roomId);
    if (room && room.pass === pass) {
      callback({ success: true });
    } else {
      callback({ success: false });
    }
  });
};
