async function loadSettings() {
  try {
    const res = await fetch("/settings/get", { credentials: "include" });
    const data = await res.json();

    if (data.success) {
      document.getElementById("topicInput").value = data.settings.topic || "";
      document.getElementById("msgInput").value = data.settings.msg || "";
      document.getElementById("ucolInput").value = data.settings.ucol || "#000000";
      document.getElementById("mcolInput").value = data.settings.mcol || "#000000";
      document.getElementById("bgInput").value = data.settings.bg || "#FFFFFF";
      document.getElementById("avatarPreview").src = "/uploads/avatars/" + (data.settings.pic || "pic.png");
    }
  } catch (err) {
    console.error("فشل في تحميل الإعدادات", err);
  }
}

async function saveSettings() {
  const topic = document.getElementById("topicInput").value.trim();
  const msg = document.getElementById("msgInput").value.trim();
  const ucol = document.getElementById("ucolInput").value;
  const mcol = document.getElementById("mcolInput").value;
  const bg = document.getElementById("bgInput").value;

  try {
    const res = await fetch("/settings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ topic, msg, ucol, mcol, bg })
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ تم حفظ الإعدادات");

      // ✅ تحديث الواجهة مباشرة بعد الحفظ
      updateUserAppearance({ topic, msg, ucol, mcol, bg });

    } else {
      alert("❌ فشل في الحفظ");
    }
  } catch (err) {
    alert("🚫 فشل في الاتصال بالسيرفر");
    console.error(err);
  }
}


document.getElementById("imageInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const avatar = document.getElementById("avatarPreview");
  const loadingText = document.getElementById("avatarLoading");

  // ✅ إظهار لودنق وإخفاء الصورة
  loadingText.style.display = "block";
  avatar.style.display = "none";

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("/settings/upload-pic", {
      method: "POST",
      credentials: "include",
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      avatar.src = "/uploads/avatars/" + data.fileName;
      alert("✅ تم رفع الصورة");
    } else {
      alert("❌ فشل في رفع الصورة");
    }
  } catch (err) {
    alert("🚫 خطأ أثناء رفع الصورة");
    console.error(err);
  } finally {
    // ✅ إعادة الصورة وإخفاء اللودنق
    loadingText.style.display = "none";
    avatar.style.display = "block";
  }
});


async function deletePicture() {
  const confirmDelete = confirm("هل أنت متأكد من حذف الصورة؟");
  if (!confirmDelete) return;

  const res = await fetch("/settings/delete-pic", {
    method: "DELETE",
    credentials: "include"
  });

  const data = await res.json();
  if (data.success) {
    document.getElementById("avatarPreview").src = "/uploads/avatars/pic.png";
    alert("✅ تم حذف الصورة");
  } else {
    alert("❌ فشل في حذف الصورة");
  }
}

function updateUserAppearance({ topic, msg, ucol, mcol, bg }) {
  // لو في مكان يظهر فيه الزخرفة أو الحالة، حدثه
  const displayNameEl = document.querySelector(".user-topic");
  if (displayNameEl) displayNameEl.textContent = topic;

  const statusEl = document.querySelector(".user-status");
  if (statusEl) statusEl.textContent = msg;

  document.body.style.backgroundColor = bg;

  // مثال: تحديث ألوان الاسم والرسائل في القائمة
  const nameEl = document.querySelector(".user-name");
  if (nameEl) nameEl.style.color = ucol;

  const msgEl = document.querySelector(".user-msg");
  if (msgEl) msgEl.style.color = mcol;
}


document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
});
