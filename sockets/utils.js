function sendSystemMessage(io, room, user, action, roomName, roomId = room) {
  let actionText = "";
  let color = "";
  let icon = "";

  switch (action) {
    case "join":
      actionText = "هذا المستخدم انضم الى";
      icon = "✅";
      color = "#28a745";
      break;

    case "leave_room":
      actionText = "هذا المستخدم غادر الغرفة";
      icon = "↩️";
      color = "#ff0707";
      break;

    case "leave_chat":
      actionText = "هذا المستخدم غادر الدردشة";
      icon = "❌";
      color = "#ff0707";
      break;

    case "leave":
      actionText = "هذا المستخدم قد غادر";
      icon = "❌";
      color = "#dc3545";
      break;

    case "switch":
      actionText = "هذا المستخدم أنتقل الى";
      icon = "➡️";
      color = "#17a2b8";
      break;

    default:
      actionText = action;
  }

  io.to(room).emit("new_message", {
    username: "", // الاسم ضمن الرسالة نفسها
    profilePicture: user.profilePicture || '/uploads/default-avatar.png',

    message: `
      <div class="notif-content">
        <div class="notif-username" style="
          background: ${user.bg || '#eee'};
          color: ${user.ucol || '#000'};
          font-weight: bold;
          display: inline-block;
          word-break: break-word;
          font-size: 16px;
          max-width: 50%;
        ">
          ${user.topic || user.name}
        </div>

        <div class="custom-join-msg" style="display: flex; align-items: center; gap: 6px;">
          <div class="action-text" style="color: ${color}; font-size: 14px; margin-top: 1px; display: flex; align-items: center; gap: 6px;">

            <span style="font-size: 16px;">${icon}</span>

            ${
              action === 'leave_chat' ? '' : `
              <span class="room-tag">
                <a href="#" class="room-link" data-room="${roomId}" style="text-decoration: none; color: inherit;">
                  ${roomName}
                </a>
              </span>
            `}

            <span>${actionText}</span>
          </div>
        </div>
    `,
    fontColor: "#000",
    fontSize: "14px",
    fontStyle: "normal"
  });
}


module.exports = {
  sendSystemMessage
};
