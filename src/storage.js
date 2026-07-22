const keys = {
  access: "photoschool_demo_access",
  cart: "photoschool_demo_cart",
  favorites: "photoschool_demo_favorites",
  orders: "photoschool_demo_orders",
  users: "photoschool_demo_users",
  userSession: "photoschool_demo_user_session",
  userGalleryAccess: "photoschool_demo_user_gallery_access",
  notificationSubscriptions: "photoschool_demo_notification_subscriptions",
  notifications: "photoschool_demo_notifications",
  readNotifications: "photoschool_demo_read_notifications",
  adminSchools: "photoschool_demo_admin_schools",
  adminEvents: "photoschool_demo_admin_events",
  adminGalleries: "photoschool_demo_admin_galleries",
  publicGalleries: "photoschool_demo_public_galleries",
  appSettings: "photoschool_settings",
};

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function clearDemoStorage() {
  Object.values(keys).forEach((key) => localStorage.removeItem(key));
}

export { keys };
