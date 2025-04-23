const express = require('express');
const router = express.Router();
const db = require('../models');
const hasPermission = require('../middleware/hasPermission');

// عرض كل المجموعات
router.get('/admin/groups', hasPermission('can_edit_permissions'), async (req, res) => {
  const groups = await db.Group.findAll();
  res.render('groups', { groups });
});

// عرض صفحة التعديل
router.get('/admin/groups/edit/:id', hasPermission('can_edit_permissions'), async (req, res) => {
  const group = await db.Group.findByPk(req.params.id);
  const permissions = JSON.parse(group.permissions || '{}');

  const allPermissions = [
    { key: 'can_kick', label: 'الطرد' },
    { key: 'can_delete_wall', label: 'حذف الحائط' },
    { key: 'can_send_notifications', label: 'التنبيهات' },
    { key: 'can_change_nick', label: 'تغيير النك' },
    { key: 'can_change_nicks', label: 'تغيير النكات' },
    { key: 'can_ban', label: 'الباند' },
    { key: 'can_send_ads', label: 'الإعلانات' },
    { key: 'can_open_private', label: 'فتح الخاص' },
    { key: 'can_move_user', label: 'نقل من الغرفة' },
    { key: 'can_manage_rooms', label: 'إدارة الغرف' },
    { key: 'can_create_rooms', label: 'إنشاء الغرف' },
    { key: 'max_static_rooms', label: 'أقصى حد للغرف الثابتة' },
    { key: 'can_manage_users', label: 'إدارة العضويات' },
    { key: 'can_mute_user', label: 'إسكات العضو' },
    { key: 'can_edit_likes', label: 'تعديل لايكات العضو' },
    { key: 'can_use_filter', label: 'الفلتر' },
    { key: 'can_manage_subscriptions', label: 'الاشتراكات' },
    { key: 'can_manage_shortcuts', label: 'الاختصارات' },
    { key: 'can_send_messages', label: 'رسائل الدردشة' },
    { key: 'can_use_monitor_filter', label: 'فلتر المراقبة' },
    { key: 'can_edit_permissions', label: 'تعديل الصلاحيات' },
    { key: 'can_customize_profile', label: 'تصميم عضوية' },
    { key: 'can_send_gifts', label: 'الهدايا' },
    { key: 'can_view_nicks', label: 'كشف النكات' },
    { key: 'can_access_admin', label: 'لوحة التحكم' },
    { key: 'can_join_full_rooms', label: 'الغرف الممتلئة والمغلقة' },
    { key: 'can_delete_user_pic', label: 'حذف صورة العضو' },
    { key: 'can_delete_public_msgs', label: 'حذف الرسائل العامة' },
    { key: 'can_be_invisible', label: 'مخفي' },
    { key: 'can_give_banner', label: 'إعطاء بنر' },
    { key: 'can_manage_site', label: 'إدارة الموقع' },
  ];

  res.render('edit-group', { group, permissions, allPermissions });
});

// حفظ التعديلات
router.post('/admin/groups/edit/:id', hasPermission('can_edit_permissions'), async (req, res) => {
  const selected = req.body.permissions || [];
  const permissions = {};

  if (Array.isArray(selected)) {
    selected.forEach(key => {
      permissions[key] = true;
    });
  } else if (typeof selected === 'string') {
    permissions[selected] = true;
  }

  await db.Group.update(
    { permissions: JSON.stringify(permissions) },
    { where: { id: req.params.id } }
  );

  res.redirect('/admin/groups');
});

// صفحة إنشاء مجموعة
router.get('/admin/groups/create', hasPermission('can_edit_permissions'), (req, res) => {
  res.render('create-group');
});

// تنفيذ إنشاء مجموعة
router.post('/admin/groups/create', hasPermission('can_edit_permissions'), async (req, res) => {
  const { name } = req.body;
  const selected = req.body.permissions || [];
  const permissions = {};

  if (Array.isArray(selected)) {
    selected.forEach(key => {
      permissions[key] = true;
    });
  } else if (typeof selected === 'string') {
    permissions[selected] = true;
  }

  await db.Group.create({
    name,
    permissions: JSON.stringify(permissions)
  });

  res.redirect('/admin/groups');
});

module.exports = router;
