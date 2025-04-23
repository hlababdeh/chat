
const pendingWallPosts = [];
let currentRoom = "room_1";
const myId = userId; // تأكد هذا موجود فوق



// ✅ عند الاتصال الفعلي بـ socket.io
socket.on("connect", () => {

  if (!currentRoom || !username) {
    return;
  }
  socket.emit("join_room", { room: currentRoom, username });



  socket.emit("user_connected", {
    id: userId,
    name: username,
    type: userType,
    country: country,
    room: currentRoom,
    message: message,
    avatar: avatar,
  });
  

});

socket.on("refresh_rooms", () => {
  socket.emit("get_rooms"); // 🚀 استرجع عدد الغرف والعدادات
});

// ✅ إرسال رسالة
document.getElementById("send-btn").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMessage();
});

// ✅ استقبال الرسائل العامة
socket.on("new_message", (data) => {
  const msgBox = document.getElementById("chat-messages");

  const senderAvatar = data.profilePicture || '/uploads/default-avatar.png';
  const isMe = data.id === myId; // ✅ هل هذه الرسالة مني؟

  msgBox.innerHTML += `
    <div class="message">
      <div class="message-avatar">
        <img 
          src="${senderAvatar}" 
          class="user-avatar clickable-user-img avatar-img"
          alt="${data.username}" 
          data-id="${data.id}" 
          data-type="${data.type}" 
          ${isMe ? 'data-me="true"' : ''}
        />
      </div>
      <div class="message-content" style="color:${data.fontColor};font-size:${data.fontSize};font-style:${data.fontStyle};">
        <strong 
          style="color:${data.nameColor || '#000'}; 
                 background:${data.nameBg || 'transparent'}; 
                 display:inline-block;">
          ${data.username}
        </strong> ${data.message}
      </div>
    </div>
  `;

  // تحريك الرسائل لأسفل
  msgBox.scrollTop = msgBox.scrollHeight;
});


// ✅ إشعارات
socket.on("notification", (msg) => {
  const msgBox = document.getElementById("chat-messages");
  msgBox.innerHTML += `<div style="color:green;">${msg}</div>`;
  msgBox.scrollTop = msgBox.scrollHeight;
});

// ✅ تحديث الغرفة
socket.on("room_changed", (newRoom) => {
  currentRoom = newRoom;
});

// ✅ استقبال قائمة المتواجدين
socket.on("update_user_list", renderUsers);

function renderUsers(users) {
  const inRoomList = document.getElementById("users-in-room");
  const inChatList = document.getElementById("users-in-chat");
  const roomBox = document.getElementById("room-users-box"); // ✅ العنصر الخارجي لقسم الغرفة
  const roomTitle = document.getElementById("room-users-title");

  // تفريغ القوائم
  inRoomList.innerHTML = "";
  inChatList.innerHTML = "";

  // ✅ إظهار أو إخفاء القسم حسب وجود currentRoom
  if (!currentRoom || currentRoom === "null") {
    if (roomBox) roomBox.style.display = "none";
  } else {
    if (roomBox) roomBox.style.display = "block";
  }

  // المتواجدون في الغرفة الحالية
  const usersInRoom = users.filter(user => user.room === currentRoom);

  // المتواجدون في الدردشة (كل المتصلين باستثناء الموجودين في الغرفة)
  const usersNotInRoom = users.filter(user => {
    return !currentRoom || user.room !== currentRoom;
  });

  // ✅ تحديث العدادات
  document.getElementById("user-count").innerText = usersInRoom.length;
  document.getElementById("total-user-count").innerText = users.length;

  // ✅ عرض اسم الغرفة
  if (roomTitle) {
    if (currentRoom && currentRoom !== "null") {
      const roomIdNum = parseInt(currentRoom.replace("room_", ""));
      const roomInfo = (window.rooms || []).find(r => r.idroom === roomIdNum);
      roomTitle.innerText = roomInfo ? ` المتواجدون في  ${roomInfo.topic}` : "المتواجدون في الغرفة";
    } else {
      roomTitle.innerText = "المتواجدون في الغرفة";
    }
  }

// ✅ بناء كرت المستخدم مع تمييز المستخدم الحالي
const createUserCard = (user) => {
  const li = document.createElement("li");
  li.classList.add("user-card");
  li.dataset.username = user.name.toLowerCase();
  const displayName = user.topic || user.name;

  // نحدد إن كانت هذه بطاقة المستخدم الحالي
  const isMe = user.id === myId;

  li.innerHTML = `
    <div class="user-left">
      <img 
        src="${user.profilePicture}" 
        class="user-avatar avatar-img" 
        alt="${user.name}"
        ${isMe ? 'data-me="true"' : ''}
      />
      <div class="user-info">
        <div class="user-name" style="
          background: ${user.bg || '#FFFFFF'};
          color: ${user.ucol || '#000000'};
          padding: 3px 8px;
          border-radius: 5px;
          display: inline-block;
          font-weight: bold;
        ">
           ${displayName}
        </div>
        <div class="user-status">${user.message || 'عضو جديد'}</div>
      </div>
    </div>
    <div class="user-right text-end">
      <div class="user-id">#${user.id}</div>
      <img src="/flags/${user.country?.toLowerCase() || 'unknown'}.png" class="user-flag" />
    </div>
  `;
  
  return li;
};


  // ✅ عرض المستخدمين
  usersInRoom.forEach(user => inRoomList.appendChild(createUserCard(user)));
  usersNotInRoom.forEach(user => inChatList.appendChild(createUserCard(user)));

  // ✅ تمرير تلقائي
  inRoomList.scrollTop = inRoomList.scrollHeight;
  inChatList.scrollTop = inChatList.scrollHeight;
}




function sendMessage() {
  const msgInput = document.getElementById("message-input");
  if (!msgInput) return; // 🛑 حماية من الانهيار

  const message = msgInput.value;
  if (message.trim() === '') return;

  // 🛑 تأكد أن المستخدم داخل غرفة
  if (!currentRoom) {
    alert("❌ يجب أن تكون داخل غرفة لإرسال رسالة.");
    return;
  }

  socket.emit("send_message", {
    room: currentRoom,
    message,
    username,
    fontColor: document.getElementById("text-color")?.value || "#000",
    fontSize: "16px",
    fontStyle: "normal"
  });

  msgInput.value = "";
}



socket.on("connect_error", (err) => {
  if (err.message === "Unauthorized") {
    sessionStorage.clear();
    window.location.href = '/';
  }
});

  // دالة لإغلاق كل التبويبات
function closeAllTabs() {
  document.getElementById("online-users").style.display = "none";
  document.getElementById("rooms-container").style.display = "none";
  document.getElementById("wall-container").style.display = "none";
  document.getElementById("settings-container").style.display = "none";
  document.getElementById("private-chats-container").style.display = "none";
  document.body.style.overflow = "auto"; // ✅ رجّع التمرير
}

// ✅ تبديل ظهور تبويبة معينة + إصلاح مشكلة السكولر
function toggleTab(tabId) {
  const tab = document.getElementById(tabId);
  const isOpen = tab.style.display === "block";

  closeAllTabs();

  if (!isOpen) {
    tab.style.display = "block";
    document.body.style.overflow = "hidden";

    // إصلاح السكولر بعد الفتح
    setTimeout(() => {
      const scrollArea = tab.querySelector(".scroll-area");
      if (scrollArea) {
        scrollArea.scrollTop = 1;
        scrollArea.scrollTop = 0;
      }
    }, 50);

  } else {
    document.body.style.overflow = "auto";
  }
}


// ربط الأزرار بالتبويبات
document.getElementById("toggle-settings-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTab("settings-container");
});

document.getElementById("toggle-rooms-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTab("rooms-container");
});


// ✅ تفعيل الحائط

let wallHandlerInitialized = false;

document.getElementById("toggle-wall-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTab("wall-container");

  // تصفير عداد الإشعارات
  const notif = document.getElementById("wallNotif");
  if (notif) {
    notif.textContent = "0";
    notif.style.display = "none";
  }

  if (!wallHandlerInitialized) {
    window.wallHandler = new WallPostHandler();
    window.wallHandler.loadPosts().then(() => {
      // ✅ عرض الرسائل اللي وصلت أثناء إغلاق الحائط
      pendingWallPosts.forEach(p => window.wallHandler.drawWallPost(p, false));
      pendingWallPosts.length = 0;
    });
    wallHandlerInitialized = true;
  } else {
    // ✅ الحائط مفعّل مسبقًا؟ فقط اعرض المؤقتة
    pendingWallPosts.forEach(p => window.wallHandler.drawWallPost(p, false));
    pendingWallPosts.length = 0;
  }
});


socket.off("msg");
socket.on("msg", (data) => {
  const isWallOpen = document.getElementById("wall-container")?.style.display === "block";

  switch (data.cmd) {
    case "wall_post":
      // ✅ استخدم البيانات كما هي من السيرفر
      const post = {
        id: data.data.id,                  // ✅ مهم جداً
        uid: data.data.uid,                // ✅ لتحديد المالك
        msg: data.data.msg,
        pic: data.data.pic,
        username: data.data.username || "مستخدم",
        avatar: data.data.avatar || "/uploads/default-avatar.png",
        createdAt: data.data.createdAt,
      };

      if (isWallOpen && window.wallHandler) {
        window.wallHandler.drawWallPost(post, false);
      } else {
        pendingWallPosts.push(post);
        const notif = document.getElementById("wallNotif");
        if (notif) {
          let count = parseInt(notif.textContent) || 0;
          notif.textContent = count + 1;
          notif.style.display = "inline-block";
        }
      }
      break;

    case "wall_delete":
      const postToDelete = document.querySelector(`.chat-message[data-id="${data.id}"]`);
      if (postToDelete) postToDelete.remove();
      break;

    case "wall_like":
      const likedPost = document.querySelector(`.chat-message[data-id="${data.data.id}"]`);
      if (likedPost) {
        const likeCount = likedPost.querySelector(".like-count");
        if (likeCount) {
          const likes = Array.isArray(data.data.likes) ? data.data.likes : [];
          likeCount.textContent = likes.length;
        }
      }
      break;
 
     case "wall_comment":
  const container = document.querySelector(`.comment-section[data-id="${data.data.postId}"] .comments-list`);
  if (container) {
    const c = data.data.comment;

    const postElement = document.querySelector(`.wall-item.chat-message[data-id="${data.data.postId}"]`);
    const postOwnerId = postElement?.dataset.uid;

    // تم إزالة منطق التحقق من صلاحية الحذف (canDelete)
    // وكذلك حذف الزر المخصص للحذف

    const cDiv = document.createElement("div");
    cDiv.className = "single-comment";
    cDiv.innerHTML = `
      <div class="avatar"><img src="${c.avatar}" /></div>
      <div class="content">
        <b>${c.username}</b>
        <span class="comment-time">${window.wallHandler.getTimeAgo(c.time)}</span><br/>
        ${c.text}
      </div>
    `;

    container.appendChild(cDiv);

    // ✅ تحديث عدد التعليقات
    const toggleBtn = document.querySelector(`.toggle-comments[data-id="${data.data.postId}"]`);
    if (toggleBtn) {
      let countSpan = toggleBtn.querySelector(".comment-count");
      const currentCount = container.querySelectorAll(".single-comment").length;
      if (countSpan) {
        countSpan.textContent = `(${currentCount})`;
      } else {
        countSpan = document.createElement("span");
        countSpan.className = "comment-count";
        countSpan.textContent = `(${currentCount})`;
        toggleBtn.appendChild(countSpan);
      }
    }
  }
  break;
} // أغلق هنا switch
}); // أغلق هنا socket.on



document.getElementById("loadMoreBtn")?.addEventListener("click", () => {
  window.wallHandler?.loadMorePosts?.();
});

document.getElementById("toggle-private-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTab("private-chats-container");
});

document.getElementById("toggle-users-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  toggleTab("online-users");
});

// إغلاق التبويبات عند الضغط في أي مكان خارجها
document.addEventListener("click", () => {
  closeAllTabs();
});

// منع الإغلاق إذا ضغطت داخل التبويبة
["online-users", "rooms-container", "settings-container", "private-chats-container", "wall-container"].forEach(id => {
  const tab = document.getElementById(id);
  if (tab) {
    tab.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
});

// ✅ عند الضغط على زر X داخل التبويبة يتم إغلاقها فقط
document.querySelectorAll('.tab-close-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // منع الإغلاق العام

    const targetId = btn.dataset.target;
    const target = document.getElementById(targetId);
    if (target) {
      target.style.display = 'none';
    }
  });
});

document.getElementById("search-users").addEventListener("input", function () {
  const query = this.value.toLowerCase();

  const filterList = (selector) => {
    document.querySelectorAll(selector).forEach(user => {
      const name = user.dataset.username;
      user.style.display = name.includes(query) ? "block" : "none";
    });
  };

  filterList("#users-in-room .user-card");
  filterList("#users-in-chat .user-card");
});


document.getElementById("leave-room-btn").addEventListener("click", () => {
  if (!currentRoom) return;

  socket.emit("leave_room", {
    room: currentRoom,
    username: username
  });

  currentRoom = null;

 // document.getElementById("chat-messages").innerHTML = "";
  document.getElementById("message-input").disabled = true;
  document.getElementById("message-input").placeholder = "أنت لست داخل غرفة";

  highlightCurrentRoom(); // أو احذفها لو بدك تلغي التمييز
  socket.emit("get_rooms"); // ✅ ضروري لتحديث العداد
});


document.getElementById("logout-btn").addEventListener("click", async function () {
  if (!confirm("هل أنت متأكد أنك تريد تسجيل الخروج؟")) return;

  try {
    const response = await fetch("/logout", {
      method: "POST",
      credentials: "include"
    });

    if (response.redirected) {
      window.location.href = response.url;
    } else {
      // احتياطاً لو ما صار redirect تلقائي
      window.location.href = "/";
    }
  } catch (err) {
    console.error("❌ فشل تسجيل الخروج:", err);
    alert("حدث خطأ أثناء تسجيل الخروج.");
  }
});

window.addEventListener("beforeunload", function () {
  fetch("/logout", {
    method: "POST",
    credentials: "include"
  });
});





