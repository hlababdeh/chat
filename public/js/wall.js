

// ✅ الاستماع العام للرسائل من السيرفر (خارج الكلاس)
const socket = io();

// wall.js - إدارة واجهة الحائط بشكل مستقل
class WallPostHandler {
    constructor() {
      this.textInput = document.getElementById("wallMessage");
      this.fileInput = document.getElementById("wallMediaInput");
      this.sendBtn = document.getElementById("sendWallBtn");
      this.previewContainer = document.getElementById("wallMediaPreview");
      this.postsContainer = document.getElementById("wallPosts");
      
      this.lastDate = null; // ✅ ضروري لتتبع آخر تاريخ
      this.initEvents();
      
      if (!this.textInput || !this.fileInput || !this.sendBtn || !this.postsContainer) {
        console.warn("❌ عناصر واجهة الحائط غير مكتملة.");
        return;
      }

      // تطبيق التمرير داخل صندوق المنشورات
      this.postsContainer.style.flex = "1";
      this.postsContainer.style.overflowY = "auto";
      this.postsContainer.style.padding = "0px";

      
      setInterval(() => {
        document.querySelectorAll(".wall-item").forEach(item => {
          const timeSpan = item.querySelector(".time-ago");
          const created = item.dataset.created;
          if (timeSpan && created) {
            timeSpan.textContent = this.getTimeAgo(created);
          }
        });
      }, 60000); // كل 60 ثانية

      
    }

    initEvents() {
      // زر الإرسال
      this.sendBtn.addEventListener("click", () => this.sendPost());
    
      // اختيار صورة أو فيديو
      this.fileInput.addEventListener("change", () => this.previewMedia());
    
      // إرسال عند الضغط على Enter
      this.textInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault(); // منع السطر الجديد
          this.sendPost();
        }
      });
    }
    
    drawWallPost(post, appendDown = true) {
      post.bcc = typeof post.bcc === "string" ? JSON.parse(post.bcc || "[]") : (post.bcc || []);

  // ✅ تأكد من وجود likes
      post.likes = Array.isArray(post.likes)
        ? post.likes
        : typeof post.likes === "string"
        ? JSON.parse(post.likes || "[]")
        : [];

      post.uid = post.uid || userId; // لما يرسل المنشور الجديد

      const div = document.createElement("div");
      div.classList.add("wall-item", "chat-message");
      div.dataset.id = post.id;
      div.dataset.created = post.createdAt;
      div.dataset.uid = post.uid; // 👈 أضف هذا السطر!
    
      const ext = post.pic ? post.pic.split('.').pop().toLowerCase() : null;
      let media = "";
      if (post.pic) {
        if (["mp4", "webm", "ogg", "mov", "mkv"].includes(ext)) {
          media = `
            <video controls width="100%" preload="metadata">
              <source src="${post.pic}" type="video/${ext}">
              متصفحك لا يدعم تشغيل الفيديو.
            </video>`;
        } else if (["mp3", "wav", "ogg"].includes(ext)) {
          media = `
            <audio controls>
              <source src="${post.pic}" type="audio/${ext}">
              متصفحك لا يدعم تشغيل الصوت.
            </audio>`;
        } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          media = `<img src="${post.pic}" alt="media" style="max-width:100%; border-radius: 8px;" />`;
        } else {
          media = `<a href="${post.pic}" target="_blank">📁 تحميل الملف</a>`;
        }
      }
    
      // 👇 تحقق هل المستخدم صاحب المنشور (أو مشرف مستقبلاً)
      const isOwner = post.uid == userId || userType === "مشرف";

      // ✅ استبدال روابط يوتيوب بـ iframe
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g;
      post.msg = post.msg.replace(youtubeRegex, (match, videoId) => {
        return `<iframe width="100%" height="250" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
      });
          
      let deleteBtn = "";
      if (isOwner) {
        deleteBtn = `<button class="delete" data-id="${post.id}" title="حذف"><i class="fas fa-times"></i></button>`;
      }
    
      div.innerHTML = `
      <div class="avatar">
        <img src="${post.avatar || '/uploads/default-avatar.png'}" alt="avatar" />
      </div>
    
      <div class="message-content">
        <div class="header">
          <span class="username">${post.username || post.uid || 'مستخدم'}</span>
          <span class="time time-ago">${this.getTimeAgo(post.createdAt)}</span>
        </div>
    
        <div class="text">${post.msg}</div>
        <div class="media">${media}</div>
    
        <div class="actions">
          <button class="like" data-id="${post.id}" title="إعجاب">
            <i class="fas fa-heart"></i>
            <span class="like-count">${post.likes.length}</span>
          </button>
    
         <button class="toggle-comments" data-id="${post.id}">
          <span class="icon-with-count">
            <i class="fas fa-comment-dots"></i>
            ${post.bcc?.length > 0 ? `<span class="comment-count">${post.bcc.length}</span>` : ""}
          </span>
        </button>
          ${deleteBtn} <!-- ✅ يظهر فقط لصاحب المنشور -->
        </div>
    
        <div class="comment-section" data-id="${post.id}" style="display: none;">
         <div class="comment-title">💬 التعليقات</div>
          <div class="comments-list"></div>
    
          <div class="comment-input">
            <input type="text" placeholder="اكتب تعليق..." class="comment-text" />
            <button class="send-comment">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // دعم الإرسال عند الضغط على Enter
      const commentInput = div.querySelector(".comment-text");
      const sendBtn = div.querySelector(".send-comment");

      commentInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendBtn.click();
        }
      });
    
      
          // ✅ تأكد إن bcc موجودة كمصفوفة
      post.bcc = typeof post.bcc === "string" ? JSON.parse(post.bcc || "[]") : (post.bcc || []);

      // ✅ الآن نعرض التعليقات إن وجدت
      const commentList = div.querySelector(".comments-list");
      post.bcc.forEach((c, index) => {
        const cDiv = document.createElement("div");
        cDiv.className = "single-comment";
        cDiv.innerHTML = `
          <div class="avatar"><img src="${c.avatar}" /></div>
          <div class="content">
            <b>${c.username}</b>
            <span class="comment-time">${this.getTimeAgo(c.time)}</span><br/>
            ${c.text}
          </div>
        `;
      

        commentList.appendChild(cDiv);
      });
      appendDown ? this.postsContainer.appendChild(div) : this.postsContainer.prepend(div);
    }
    

    previewMedia() {
      const file = this.fileInput.files[0];
      this.previewContainer.innerHTML = "";

      if (!file) return;

      const type = file.type;
      const url = URL.createObjectURL(file);

      if (type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = url;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "5px";
        this.previewContainer.appendChild(img);
      } else if (type.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.style.maxWidth = "100%";
        this.previewContainer.appendChild(video);
      }
    }

    async sendPost() {
      const msg = this.textInput.value.trim();
      const file = this.fileInput.files[0];
    
      if (!msg && !file) {
        alert("📝 يرجى كتابة رسالة أو اختيار ملف.");
        return;
      }
    
      const formData = new FormData();
      formData.append("msg", msg);
      if (file) formData.append("media", file);
    
      try {
        const res = await fetch("/Wall", {
          method: "POST",
          body: formData
        });
    
        const data = await res.json();
    
        if (data && data.id) {
          this.textInput.value = "";
          this.fileInput.value = null;
          this.previewContainer.innerHTML = "";
    
          // ✅ إذا أرسل ملف صوتي، شغّله تلقائيًا إن أحببت:
          if (file && file.type.startsWith("audio/")) {
            const audio = new Audio(`/uploads/${data.pic}`);
            // audio.play(); // ❗️إذا بدك تشغيل تلقائي
          }
    
          console.log("✅ منشورك تم إرساله.");
        } else {
          console.error("⚠️ فشل في الإرسال:", data);
        }
      } catch (err) {
        console.error("❌ فشل الاتصال بالسيرفر:", err);
      }
    }
    

    getTimeAgo(createdAt) {
      const now = new Date();
      const created = new Date(createdAt);
      const diffMin = Math.floor((now - created) / 60000);
    
      if (diffMin < 1) return "الآن";
      if (diffMin < 60) return `${diffMin} د`;  // تغيير هنا
      const diffHr = Math.floor(diffMin / 60);
      return `${diffHr} س`;  // تغيير هنا
    }

    async loadPosts() {
      this.postsContainer.innerHTML = "جارٍ التحميل...";
    
      try {
        const res = await fetch(`/Wall?limit=20`);
        const posts = await res.json();
    
        this.postsContainer.innerHTML = "";
    
        if (posts.length === 0) {
          this.postsContainer.innerHTML = "<div class='text-center text-muted'>لا يوجد منشورات حتى الآن.</div>";
          this.hideLoadMoreBtn(); // إخفاء زر "مشاهدة المزيد"
          return;
        }
    
        posts.forEach(post => this.drawWallPost(post));
    
        this.lastDate = posts[posts.length - 1].createdAt;
    
        if (posts.length < 20) {
          this.hideLoadMoreBtn(); // إخفاء الزر إذا لم يكن هناك المزيد
        } else {
          this.showLoadMoreBtn(); // إظهاره إذا كان هناك احتمال لمنشورات أخرى
        }
    
      } catch (err) {
        this.postsContainer.innerHTML = "❌ فشل في تحميل المنشورات.";
        console.error("❌ خطأ في جلب المنشورات:", err);
      }
    }
    
    // دوال مساعدة لإظهار/إخفاء الزر
    showLoadMoreBtn() {
      const btn = document.getElementById("loadMoreBtn");
      if (btn) btn.style.display = "block";
    }
    
    hideLoadMoreBtn() {
      const btn = document.getElementById("loadMoreBtn");
      if (btn) btn.style.display = "none";
    }
    
    
    async loadMorePosts() {
      if (!this.lastDate) return;
    
      const res = await fetch(`/Wall?limit=20&lastDate=${encodeURIComponent(this.lastDate)}`);
      const posts = await res.json();
    
      posts.forEach(post => this.drawWallPost(post));
      if (posts.length > 0) {
        this.lastDate = posts[posts.length - 1].createdAt;
      }
    }

    
    incrementWallNotif() {
      const notif = document.getElementById("wallNotif");
      if (notif) {
        let count = parseInt(notif.textContent) || 0;
        notif.textContent = count + 1;
        notif.style.display = "inline-block"; // نعرضه فقط عند وجود إشعار
        console.log("📢 إشعار جديد بالحائط");
      }
    }
    
    async fetchPosts() {
      const params = new URLSearchParams();
      params.append("limit", this.limit);
    
      if (this.lastDate) {
        params.append("lastDate", this.lastDate);
      }
    
      const res = await fetch(`/Wall?${params.toString()}`);
      return await res.json();
    }
     
  } // ًنهاية WallPostHandler    


  document.getElementById("wallPosts").addEventListener("click", async (e) => {
    const btn = e.target.closest("button.delete");
    if (!btn) return;
  
    const postId = btn.dataset.id;
    if (!postId) return;
  
    try {
      await fetch(`/Wall/${postId}`, { method: "DELETE" });
      // الحذف الفعلي رح يتم من السيرفر عبر socket.io
    } catch (err) {
      alert("حدث خطأ في الاتصال بالسيرفر");
    }
  });

  // ✅ التعامل مع زر اللايك
  document.getElementById("wallPosts").addEventListener("click", async (e) => {
  const likeBtn = e.target.closest("button.like");
  if (!likeBtn) return;

  const postId = likeBtn.dataset.id;
  if (!postId) return;

  try {
    const res = await fetch(`/Wall/like/${postId}`, {
      method: "POST"
    });

    const data = await res.json();

    if (data.success) {
      // التحديث سيكون من خلال socket
      console.log("✅ تم تحديث اللايك");
    } else {
      alert("⚠️ لم يتم حفظ اللايك");
    }
  } catch (err) {
    console.error("❌ فشل الاتصال:", err);
  }
});

document.getElementById("wallPosts").addEventListener("click", async (e) => {
  const sendBtn = e.target.closest(".send-comment");
  if (!sendBtn) return;

  const commentSection = sendBtn.closest(".comment-section");
  const postId = commentSection.dataset.id;
  const input = commentSection.querySelector(".comment-text");
  const text = input.value.trim();

  if (!text) return;

  try {
    const res = await fetch(`/Wall/comment/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    if (data.success) {
      input.value = "";
      console.log("✅ تم إرسال التعليق");

      // التمرير إلى أسفل بعد إضافة التعليق
      const commentList = commentSection.querySelector(".comments-list");
      setTimeout(() => {
        commentList.scrollTop = commentList.scrollHeight;
      }, 0);  // التأخير بمقدار 100 مللي ثانية لضمان اكتمال إضافة التعليق
    }
  } catch (err) {
    console.error("❌ فشل في إرسال التعليق:", err);
  }
});

document.getElementById("wallPosts").addEventListener("click", (e) => {
  const toggleBtn = e.target.closest(".toggle-comments");
  if (!toggleBtn) return;

  const postId = toggleBtn.dataset.id;
  const commentSection = document.querySelector(`.comment-section[data-id="${postId}"]`);
  if (!commentSection) return;

  const isVisible = commentSection.style.display === "block";
  commentSection.style.display = isVisible ? "none" : "block";

  // التمرير لآخر تعليق عند فتح قسم التعليقات
  if (!isVisible) {  // فقط عند فتح القسم
    const commentList = commentSection.querySelector(".comments-list");
    setTimeout(() => {
      commentList.scrollTop = commentList.scrollHeight;  // التمرير إلى أسفل
    }, 100);  // التأخير بمقدار 100 مللي ثانية لضمان اكتمال عرض التعليقات
  }
});



