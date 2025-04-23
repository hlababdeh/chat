// إرسال طلب جلب الغرف عند الاتصال
socket.emit("get_rooms");

// استقبال قائمة الغرف من السيرفر
// استقبال قائمة الغرف من السيرفر
socket.on("room_list", (rooms) => {
  window.rooms = rooms; // ✅ ضروري حتى نقدر نستخدمها لاحقًا
  const list = document.getElementById("rooms-list");
  list.innerHTML = "";

  // ✅ ترتيب الغرف حسب عدد المتواجدين
  rooms.sort((a, b) => (b.currentCount || 0) - (a.currentCount || 0));

  rooms.forEach(room => {
    const li = document.createElement("li");
    li.classList.add("room-item");
    li.dataset.roomId = `room_${room.idroom}`; // 👈 أضف هذا السطر

    li.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="/uploads/${room.pic || 'default-room.png'}" class="room-avatar me-2" alt="${room.topic}" />
        <div>
          <span class="room-badge">${room.currentCount || 0}/${room.max || 0}</span>
          <strong>${room.topic}</strong><br>
          <small class="text-muted">${room.about}</small>
        </div>
      </div>
    `;

    li.onclick = () => changeRoom(room.idroom);
    list.appendChild(li);
  });

  // ✅ بعد عرض الغرف، فعل التمييز
  highlightCurrentRoom();
});

// ✅ تغيير الغرفة مع فحص الغرفة الحالية
function changeRoom(newRoomId) {
  const newRoom = `room_${newRoomId}`;
  if (currentRoom === newRoom) return;

  socket.emit("change_room", {
    oldRoom: currentRoom,
    newRoom: newRoom,
    username: username
  });

  currentRoom = newRoom;

    // ✅ فعّل الإرسال
    document.getElementById("message-input").disabled = false;
    document.getElementById("message-input").placeholder = "اكتب رسالتك هنا...";
  // ✅ أعد تحميل الغرف للتحديث
  socket.emit("get_rooms");
  // ✅ فعل تمييز الغرفة الحالية
  highlightCurrentRoom();
  console.log("🚀 الانتقال من:", currentRoom, "إلى:", newRoom, "بواسطة:", username);

}

// ✅ تمييز الغرفة الحالية ببوردر
function highlightCurrentRoom() {
  const allRooms = document.querySelectorAll(".room-item");
  allRooms.forEach(room => {
    if (room.dataset.roomId === currentRoom) {
      room.classList.add("active-room");
    } else {
      room.classList.remove("active-room");
    }
  });
}


document.addEventListener("click", function (e) {
  const link = e.target.closest(".room-link");
  if (link) {
    e.preventDefault();

    const fullRoomId = link.dataset.room; // مثل room_3
    const roomIdNumber = parseInt(fullRoomId.replace("room_", ""));

    if (!isNaN(roomIdNumber)) {
      changeRoom(roomIdNumber); // ✅ هاي دالتك الرسمية
    }
  }
});



// ✅ إعادة تحميل الغرف عند الطلب من السيرفر
socket.on("refresh_rooms", () => {
  socket.emit("get_rooms");
});
