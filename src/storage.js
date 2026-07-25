const keys = {
  access: "photoschool_access",
  cart: "photoschool_cart",
  favorites: "photoschool_favorites",
  orders: "photoschool_orders",
  users: "photoschool_users",
  userSession: "photoschool_user_session",
  userGalleryAccess: "photoschool_user_gallery_access",
  notificationSubscriptions: "photoschool_notification_subscriptions",
  notifications: "photoschool_notifications",
  readNotifications: "photoschool_read_notifications",
  adminSchools: "photoschool_admin_schools",
  adminEvents: "photoschool_admin_events",
  adminGalleries: "photoschool_admin_galleries",
  publicGalleries: "photoschool_public_galleries",
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

export function clearLocalStorage() {
  Object.values(keys).forEach((key) => localStorage.removeItem(key));
}

export { keys };
