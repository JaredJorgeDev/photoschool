import { appConfig } from "./config.js";
import { mockDb } from "./mock-data.js";
import { calculateCartTotals, formatMoney, formatRuleLabel, volumeMessage } from "./pricing.js";
import { keys, readJson, writeJson } from "./storage.js";

const app = document.querySelector("#app");

function currentClientRoute() {
  if (location.hash) return location.hash;
  const cleanPath = location.pathname.replace(/\/+$/, "") || "/";
  if (cleanPath === "/") return "#/";
  return `#${cleanPath}${location.search || ""}`;
}

const state = {
  route: currentClientRoute(),
  eventSlug: "festival-fin-cursos-2026",
  activeEventSlug: "festival-fin-cursos-2026",
  selectedCategory: "Todas",
  query: "",
  modalIndex: null,
  adminView: "dashboard",
  adminAuthed: readJson("photoschool_demo_admin_auth", false),
  galleryLimit: 12,
  touchStartX: 0,
  userView: "galleries",
};

const demoSchools = () => readJson(keys.adminSchools, mockDb.schools);
const setDemoSchools = (schools) => writeJson(keys.adminSchools, schools);
const demoEvents = () => readJson(keys.adminEvents, mockDb.events);
const setDemoEvents = (events) => writeJson(keys.adminEvents, events);
const demoGalleries = () => readJson(keys.adminGalleries, mockDb.galleries);
const setDemoGalleries = (galleries) => writeJson(keys.adminGalleries, galleries);
const publicGalleries = () => readJson(keys.publicGalleries, mockDb.public_galleries);
const setPublicGalleries = (galleries) => writeJson(keys.publicGalleries, galleries);
const savedOrders = () => [...mockDb.orders, ...readJson(keys.orders, [])];
const demoUsers = () => readJson(keys.users, mockDb.users);
const setDemoUsers = (users) => writeJson(keys.users, users);
const userSession = () => readJson(keys.userSession, null);
const setUserSession = (user) => writeJson(keys.userSession, user);
const userAccess = () => readJson(keys.userGalleryAccess, mockDb.user_gallery_access);
const setUserAccess = (items) => writeJson(keys.userGalleryAccess, items);
const notificationSubscriptions = () => readJson(keys.notificationSubscriptions, mockDb.notification_subscriptions);
const setNotificationSubscriptions = (items) => writeJson(keys.notificationSubscriptions, items);
const demoNotifications = () => readJson(keys.notifications, mockDb.notifications);
const setDemoNotifications = (items) => writeJson(keys.notifications, items);
const appSettings = () => readJson(keys.appSettings, null);
const setAppSettings = (settings) => writeJson(keys.appSettings, settings);
const favorites = () => readJson(keys.favorites, []);
const cart = () => readJson(keys.cart, []);
const access = () => readJson(keys.access, {});
const brandLogo = "./assets/logo.png";
const heroImage = "./assets/hero.png";

function whatsappHref(message = appConfig.contact.whatsappMessage) {
  return `https://wa.me/${appConfig.contact.whatsappInternational}?text=${encodeURIComponent(message)}`;
}

function runtimeConfig() {
  const settings = appSettings();
  if (!settings) return appConfig;
  return {
    ...appConfig,
    brand: { ...appConfig.brand, ...(settings.brand || {}) },
    access: { ...appConfig.access, ...(settings.access || {}) },
    pricing: {
      ...appConfig.pricing,
      ...(settings.pricing || {}),
      volumeRules: settings.pricing?.volumeRules || appConfig.pricing.volumeRules,
    },
    lifecycle: { ...appConfig.lifecycle, ...(settings.lifecycle || {}) },
    delivery: { ...appConfig.delivery, ...(settings.delivery || {}) },
    payments: {
      ...appConfig.payments,
      ...(settings.payments || {}),
      methods: settings.payments?.methods || appConfig.payments.methods,
    },
    reactivation: { ...appConfig.reactivation, ...(settings.reactivation || {}) },
    timezone: settings.timezone || appConfig.timezone,
  };
}

function editableSettingsFromConfig(config = runtimeConfig()) {
  const ruleOne = config.pricing.volumeRules[0] || { min: 1, max: 5, unitPrice: 45 };
  const ruleTwo = config.pricing.volumeRules[1] || { min: 6, max: 10, unitPrice: 40 };
  const ruleThree = config.pricing.volumeRules[2] || { min: 11, max: null, unitPrice: 35 };
  return {
    brand: { plannedDomain: config.brand.plannedDomain },
    access: { type: config.access.type },
    timezone: config.timezone,
    pricing: {
      currency: config.pricing.currency,
      volumeRules: [
        { min: 1, max: 5, unitPrice: Number(ruleOne.unitPrice || 45) },
        { min: 6, max: 10, unitPrice: Number(ruleTwo.unitPrice || 40) },
        { min: 11, max: null, unitPrice: Number(ruleThree.unitPrice || 35) },
      ],
      printAddonPerCopy: Number(config.pricing.printAddonPerCopy || 5),
    },
    lifecycle: {
      galleryValidityMonths: Number(config.lifecycle.galleryValidityMonths || 2),
      downloadAvailabilityDays: Number(config.lifecycle.downloadAvailabilityDays || 7),
    },
    delivery: {
      printDeliveryType: "recoleccion_personal",
      printDeliveryLabel: config.delivery.printDeliveryLabel,
      printDeliveryNote: config.delivery.printDeliveryNote,
    },
    payments: {
      primary: config.payments.primary || "mercado_pago",
      alternative: config.payments.alternative || "transferencia",
      methods: [
        {
          id: "mercado_pago",
          label: config.payments.methods.find((method) => method.id === "mercado_pago")?.label || "Mercado Pago",
          kind: "configurado",
          statusAfterConfirm: "Pago aprobado",
        },
        {
          id: "transferencia",
          label: config.payments.methods.find((method) => method.id === "transferencia")?.label || "Transferencia bancaria",
          kind: "configurado",
          statusAfterConfirm: "Pago pendiente",
        },
      ],
    },
    reactivation: {
      options: config.reactivation.options,
    },
  };
}

function settingsFromForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const base = runtimeConfig();
  const options = base.settingsOptions;
  const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  const allowedValue = (items, value, fallback) => items.some((item) => String(item.id) === String(value)) ? value : fallback;
  const allowedNumber = (items, value, fallback) => Number(allowedValue(items, Number(value), fallback));
  const timezone = allowedValue(options.timezones, data.timezone, appConfig.timezone);
  const galleryMonths = allowedNumber(options.galleryValidityMonths, data.gallery_months, 2);
  const downloadDays = allowedNumber(options.downloadAvailabilityDays, data.download_days, 7);
  const primaryPayment = allowedValue(options.paymentMethods, data.primary_payment, "mercado_pago");
  const requestedAlternative = allowedValue(options.paymentMethods, data.alternative_payment, "transferencia");
  const alternativePayment = requestedAlternative === primaryPayment
    ? options.paymentMethods.find((method) => method.id !== primaryPayment)?.id || "transferencia"
    : requestedAlternative;
  const selectedPaymentMethods = [primaryPayment, alternativePayment].map((id) => options.paymentMethods.find((method) => method.id === id));
  const deliveryType = allowedValue(options.printDeliveryTypes, data.delivery_type, "recoleccion_personal");
  const delivery = options.printDeliveryTypes.find((item) => item.id === deliveryType) || options.printDeliveryTypes[0];
  return editableSettingsFromConfig({
    ...base,
    brand: { ...base.brand, plannedDomain: String(data.planned_domain || appConfig.brand.plannedDomain).trim() },
    timezone,
    pricing: {
      currency: "MXN",
      volumeRules: [
        { min: 1, max: 5, unitPrice: toNumber(data.tier_1_5, 45) },
        { min: 6, max: 10, unitPrice: toNumber(data.tier_6_10, 40) },
        { min: 11, max: null, unitPrice: toNumber(data.tier_11_plus, 35) },
      ],
      printAddonPerCopy: toNumber(data.print_addon, 5),
    },
    lifecycle: {
      galleryValidityMonths: galleryMonths,
      downloadAvailabilityDays: downloadDays,
    },
    delivery: {
      printDeliveryType: delivery.id,
      printDeliveryLabel: delivery.label,
      printDeliveryNote: delivery.note,
    },
    payments: {
      primary: primaryPayment,
      alternative: alternativePayment,
      methods: selectedPaymentMethods.map((method) => ({ ...method, kind: "configurado" })),
    },
  });
}

async function persistSettings(settings) {
  setAppSettings(settings);
  try {
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
  } catch {
    // La maqueta sigue funcionando con persistencia local si el backend no esta disponible.
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function optionTags(options, selected) {
  return options.map((option) => {
    const id = String(option.id);
    return `<option value="${escapeHtml(id)}" ${id === String(selected) ? "selected" : ""}>${escapeHtml(option.label)}</option>`;
  }).join("");
}

function normalize(value = "") {
  return String(value).trim().toUpperCase();
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addHours(date, hours) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: runtimeConfig().timezone,
  }).format(new Date(value));
}

function countdownTo(value) {
  const diff = Math.max(0, new Date(value).getTime() - Date.now());
  if (diff <= 0) return "Lista para publicarse";
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days} días ${String(hours).padStart(2, "0")} h ${String(mins).padStart(2, "0")} min`;
  if (hours > 0) return `${String(hours).padStart(2, "0")} h ${String(mins).padStart(2, "0")} min`;
  return `${Math.max(0, mins)} min`;
}

function currentEvent() {
  return demoEvents().find((event) => event.slug === state.eventSlug) || demoEvents()[0];
}

function isEventExpired(event) {
  if (!event) return true;
  if (event.status === "reactivated") return new Date(event.expires_at || `${event.expiresAt}T23:59:59`) < new Date();
  return event.status === "expired" || event.status === "deleted" || new Date(event.expires_at || `${event.expiresAt}T23:59:59`) < new Date();
}

function effectiveEventStatus(event) {
  if (!event) return "disabled";
  if (event.status === "scheduled" && new Date(event.publish_at) <= new Date()) return "active";
  if (event.status === "active" && isEventExpired(event)) return "expired";
  if (event.status === "reactivated" && isEventExpired(event)) return "expired";
  return event.status;
}

function statusLabel(status) {
  return appConfig.galleryStates[status] || appConfig.schoolStatuses[status] || status;
}

function schoolBySlug(slug) {
  return demoSchools().find((school) => school.slug === slug);
}

function schoolById(id) {
  return demoSchools().find((school) => school.id === id);
}

function eventBySlug(slug) {
  return demoEvents().find((event) => event.slug === slug);
}

function eventById(id) {
  return demoEvents().find((event) => event.id === id);
}

function galleryBySlug(slug) {
  return demoGalleries().find((gallery) => gallery.slug === slug);
}

function getEventPhotos(eventId) {
  return mockDb.photos.filter((photo) => photo.eventId === eventId && photo.published);
}

function currentUser() {
  const session = userSession();
  if (!session) return null;
  return demoUsers().find((user) => user.id === session.userId) || null;
}

function grantGalleryAccess(user, event, source = "codigo") {
  if (!user || !event) return;
  const existing = userAccess();
  if (existing.some((item) => item.user_id === user.id && item.event_id === event.id && !item.revoked_at)) return;
  setUserAccess([
    ...existing,
    {
      id: `uga_${Date.now()}`,
      user_id: user.id,
      school_id: event.school_id || event.schoolId,
      event_id: event.id,
      granted_at: new Date().toISOString(),
      expires_at: event.expires_at || `${event.expiresAt}T23:59:59`,
      access_source: source,
      revoked_at: null,
    },
  ]);
}

function createMockNotifications(event, type, reason) {
  const relatedAccess = userAccess().filter((item) => item.event_id === event.id && !item.revoked_at);
  const users = demoUsers();
  const next = [...demoNotifications()];
  relatedAccess.forEach((accessItem) => {
    const user = users.find((item) => item.id === accessItem.user_id);
    if (!user) return;
    ["email", "whatsapp"].forEach((channel) => {
      if (channel === "email" && !user.notification_email) return;
      if (channel === "whatsapp" && !user.notification_whatsapp) return;
      const message = channel === "email"
        ? `Tu galería de ${event.name} ya está disponible`
        : `Tu galería de ${event.name} ya está disponible. Ingresa a PhotoSchool para verla. Disponible hasta ${formatDate(event.expiresAt || event.expires_at?.slice(0, 10))}.`;
      next.push({
        id: `notif_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        user_id: user.id,
        event_id: event.id,
        channel,
        type,
        status: "simulated",
        sent_at: new Date().toISOString(),
        read_at: null,
        template: message,
        attempts: 1,
        reason,
        error: "",
      });
    });
  });
  setDemoNotifications(next);
}

function photoSvg(photo, size = "large") {
  const palette = {
    Ceremonia: ["#111827", "#35c2dc", "#f8f5ed"],
    Individuales: ["#0f172a", "#b8dde7", "#f2efe7"],
    Familia: ["#17212b", "#d9aa64", "#f8f5ed"],
    Generacion: ["#101820", "#78c8b4", "#f4f0e8"],
    Convivencia: ["#141414", "#d9d2c3", "#35c2dc"],
  }[photo.category] || ["#111", "#35c2dc", "#f8f5ed"];
  const width = size === "thumb" ? 420 : 1100;
  const height = size === "thumb" ? 300 : 780;
  const title = escapeHtml(photo.identifier);
  const label = escapeHtml(photo.category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${palette[0]}"/><stop offset=".55" stop-color="${palette[1]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="${width * 0.72}" cy="${height * 0.28}" r="${height * 0.18}" fill="rgba(255,255,255,.22)"/>
    <rect x="${width * 0.09}" y="${height * 0.18}" width="${width * 0.46}" height="${height * 0.56}" rx="18" fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.36)" />
    <path d="M${width * 0.12} ${height * 0.68} C ${width * 0.3} ${height * 0.42}, ${width * 0.42} ${height * 0.8}, ${width * 0.62} ${height * 0.54} S ${width * 0.86} ${height * 0.72}, ${width * 0.94} ${height * 0.5}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="9"/>
    <text x="${width * 0.09}" y="${height * 0.88}" fill="rgba(255,255,255,.92)" font-family="Arial, sans-serif" font-size="${size === "thumb" ? 34 : 62}" font-weight="700">${title}</text>
    <text x="${width * 0.09}" y="${height * 0.94}" fill="rgba(255,255,255,.75)" font-family="Arial, sans-serif" font-size="${size === "thumb" ? 22 : 34}">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function shell(content, options = {}) {
  const isAdmin = state.route.startsWith("#/admin");
  const user = currentUser();
  return `
    <header class="site-header ${isAdmin ? "admin-shell" : ""}">
      <a class="brand" href="#/" aria-label="PhotoSchool inicio">
        <span class="brand-mark"><img src="${brandLogo}" alt="" /></span>
        <span><strong>${appConfig.brand.product}</strong><small>${appConfig.brand.parent}</small></span>
      </a>
      <nav aria-label="Navegacion principal">
        <a href="#/">Inicio</a>
        <a href="#/galerias">Galerías públicas</a>
        <a href="#como-funciona">Servicios</a>
        <a href="#contacto">Para escuelas</a>
        <a href="#/acceso">Acceso privado</a>
        ${user ? `<a href="#/cuenta">Mis galerías</a><a href="#/cuenta?view=profile">Mi cuenta</a><button class="nav-button" id="user-logout">Cerrar sesión</button>` : `<a href="#/login">Iniciar sesión</a>`}
        <a class="cart-link" href="#/carrito">Carrito <span>${cart().length}</span></a>
      </nav>
    </header>
    <main id="app-main" tabindex="-1">${content}</main>
    ${options.noFooter ? "" : footer()}
    ${options.noFooter ? "" : whatsappWidget()}
  `;
}

function footer() {
  return `
    <footer class="footer">
      <div class="footer-brand"><span class="brand-mark"><img src="${brandLogo}" alt="" /></span><div><strong>${appConfig.brand.product}</strong><span>Una plataforma privada de ${appConfig.brand.parent}.</span></div></div>
      <div>${appConfig.brand.plannedDomain}</div>
    </footer>
  `;
}

function whatsappWidget() {
  return `
    <div class="whatsapp-widget" id="whatsapp-widget">
      <div class="whatsapp-bubble" aria-live="polite">¿Necesitas ayuda con algo?</div>
      <a class="whatsapp-float" href="${whatsappHref()}" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp al ${appConfig.contact.whatsappDisplay}">
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M16.02 3.2c-7.05 0-12.78 5.62-12.78 12.54 0 2.37.68 4.68 1.96 6.67L3.1 28.8l6.65-2.06a12.98 12.98 0 0 0 6.27 1.6c7.04 0 12.78-5.63 12.78-12.55S23.06 3.2 16.02 3.2Zm0 22.98c-1.98 0-3.9-.55-5.56-1.58l-.4-.25-3.94 1.22 1.25-3.78-.27-.42a10.24 10.24 0 0 1-1.68-5.63c0-5.74 4.76-10.4 10.6-10.4 5.85 0 10.61 4.66 10.61 10.4 0 5.73-4.76 10.44-10.61 10.44Zm5.82-7.8c-.32-.16-1.9-.92-2.2-1.02-.3-.1-.52-.15-.74.16-.21.31-.84 1.02-1.03 1.23-.19.2-.38.23-.7.08-.32-.16-1.36-.49-2.6-1.57-.96-.84-1.61-1.88-1.8-2.2-.19-.31-.02-.48.14-.64.15-.14.32-.37.48-.55.16-.18.22-.31.32-.52.1-.2.05-.39-.03-.55-.08-.15-.74-1.75-1.01-2.4-.27-.62-.54-.54-.74-.55h-.63c-.22 0-.56.08-.86.39-.3.31-1.13 1.09-1.13 2.65s1.16 3.08 1.32 3.29c.16.2 2.28 3.43 5.53 4.81.77.33 1.38.53 1.85.68.78.24 1.49.2 2.05.12.62-.09 1.9-.76 2.17-1.5.27-.73.27-1.36.19-1.5-.08-.13-.3-.2-.62-.36Z" />
        </svg>
        <span>WhatsApp</span>
      </a>
    </div>
  `;
}

function renderHome() {
  app.innerHTML = shell(`
    <section class="hero protected-media">
      <img class="hero-bg" src="${heroImage}" alt="" draggable="false" aria-hidden="true" />
      <div class="hero-copy">
        <div class="hero-logo"><img src="${brandLogo}" alt="Alberto de la Fuente Fotografo" /></div>
        <p class="eyebrow">${appConfig.brand.parent}</p>
        <h1>PhotoSchool</h1>
        <p>Tus fotografias escolares, organizadas y disponibles en linea. Accede mediante el codigo de tu evento, elige tus favoritas y compra desde cualquier dispositivo.</p>
        <div class="actions">
          <a class="btn primary" href="#/acceso">Acceder a mi galeria</a>
          <a class="btn ghost" href="#contacto">Soy una escuela</a>
        </div>
      </div>
      <div class="hero-caption">
        <span>Galerias privadas</span>
        <strong>Festival de Fin de Cursos 2026</strong>
      </div>
    </section>
    ${homePublicGalleriesSection()}
    <section class="section flow" id="como-funciona">
      <p class="eyebrow">Experiencia para familias</p>
      <h2>Un recorrido claro desde el evento hasta el pedido</h2>
      <div class="steps">
        ${["Ingresa el codigo privado de tu escuela.", "Elige el evento habilitado para tu escuela.", "Valida el Codigo de galería.", "Selecciona favoritas y agregalas al carrito.", "Elige descarga digital o impresion 5x7."].map((step, index) => `<article><span>${index + 1}</span><p>${step}</p></article>`).join("")}
      </div>
    </section>
    <section class="section dark">
      <div>
        <p class="eyebrow">Photos Time</p>
        <h2>Servicios</h2>
        <p>Fotografia escolar, eventos escolares, foto generacional, credencializacion, anuarios, Folder Kit Escolar y productos impresos.</p>
      </div>
      <div class="service-grid">
        ${["Fotografia escolar", "Eventos escolares", "Foto generacional", "Credencializacion", "Anuarios", "Productos impresos"].map((item) => `<span>${item}</span>`).join("")}
      </div>
    </section>
    <section class="split section">
      <div>
        <h2>Beneficios para escuelas</h2>
        <p>Galerias por evento, vigencia controlada, codigo general, pedidos centralizados y administracion preparada para carga masiva futura.</p>
      </div>
      <div>
        <h2>Beneficios para familias</h2>
        <p>Busqueda sencilla, favoritos, seleccion desde celular, precios por volumen y eleccion entre descarga digital e impresion 5x7.</p>
      </div>
    </section>
    <section class="access-band">
      <div class="access-card">
      <h2>Acceso a galeria</h2>
      <p>Entra con el codigo privado de tu escuela y abre solo los eventos autorizados para tu comunidad.</p>
      <a class="btn primary" href="#/acceso">Acceder a mi galeria</a>
      </div>
    </section>
    <section class="section contact" id="contacto">
      <h2>Contacto</h2>
      <p>Organizamos la cobertura fotografica de tu escuela con galerias privadas, seleccion en linea y opciones de descarga o impresion para cada familia.</p>
      <div class="actions">
        <a class="btn primary whatsapp-cta" href="${whatsappHref()}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a class="btn secondary" href="#/acceso">Acceder a una galeria privada</a>
      </div>
    </section>
  `);
}

function homePublicGalleriesSection() {
  const galleries = publicGalleries().filter((gallery) => gallery.status === "active").slice(0, 3);
  return `
    <section class="section public-home" id="galerias-publicas">
      <div class="public-home-head">
        <div>
          <p class="eyebrow">Galerías públicas</p>
          <h2>Conoce el estilo fotográfico de Photos Time</h2>
          <p>Una muestra visual de graduaciones, festivales, retratos escolares y actividades académicas para escuelas que buscan una experiencia profesional de fotografía y venta en línea.</p>
        </div>
        <div class="actions">
          <a class="btn primary" href="#/galerias">Ver galerías públicas</a>
          <a class="btn secondary whatsapp-cta" href="${whatsappHref()}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
      </div>
      <div class="public-feature-grid">
        ${galleries.map((gallery, index) => {
          const photo = mockDb.photos[(gallery.coverPhotoIndex || index) % mockDb.photos.length];
          return `
            <article class="public-feature-card">
              <img src="${photoSvg(photo, "thumb")}" alt="${escapeHtml(gallery.title)}" loading="lazy" />
              <div>
                <span>${escapeHtml(gallery.category)}</span>
                <h3>${escapeHtml(gallery.title)}</h3>
                <p>${escapeHtml(gallery.description)}</p>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderPublicGalleries() {
  const galleries = publicGalleries().filter((gallery) => gallery.status === "active");
  app.innerHTML = shell(`
    <section class="section public-portfolio">
      <div class="page-title">
        <div>
          <p class="eyebrow">Galerías públicas</p>
          <h1>Portafolio escolar Photos Time</h1>
          <p>Una muestra autorizada de servicios fotográficos. Estas galerías no contienen fotografías privadas de compra y no requieren código.</p>
        </div>
        <a class="btn primary whatsapp-cta" href="${whatsappHref()}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
      </div>
      <div class="portfolio-grid">
        ${galleries.map((gallery, index) => {
          const photo = mockDb.photos[(gallery.coverPhotoIndex || index) % mockDb.photos.length];
          return `
            <article class="portfolio-card">
              <img src="${photoSvg(photo, "thumb")}" alt="${escapeHtml(gallery.title)}" loading="lazy" />
              <div>
                <span class="status-pill active">${escapeHtml(gallery.category)}</span>
                <h2>${escapeHtml(gallery.title)}</h2>
                <p>${escapeHtml(gallery.description)}</p>
                <a class="btn secondary whatsapp-cta" href="${whatsappHref(`Hola, quiero información sobre ${gallery.title} de PhotoSchool.`)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            </article>
          `;
        }).join("")}
      </div>
      <section class="section compact-section">
        <h2>Categorías</h2>
        <div class="service-grid">
          ${["Graduaciones", "Festivales escolares", "Fotografía individual", "Generaciones", "Eventos deportivos", "Actividades escolares", "Credencialización", "Anuarios"].map((item) => `<span>${item}</span>`).join("")}
        </div>
      </section>
    </section>
  `);
}

function renderAccess() {
  app.innerHTML = shell(`
    <section class="gate">
      <div class="gate-cover protected-media">
        <img src="${heroImage}" alt="Acceso privado PhotoSchool" draggable="false" />
        <span class="watermark center">PhotoSchool</span>
        <div class="gate-brand"><img src="${brandLogo}" alt="" /><span>Acceso privado</span></div>
      </div>
      <form class="gate-panel" id="school-access-form" novalidate>
        <p class="eyebrow">Acceso privado por escuela</p>
        <h1>Ingresa a tu escuela</h1>
        <p>El primer codigo protege la privacidad de cada escuela. Despues veras unicamente los eventos habilitados para tu comunidad.</p>
        <label for="school-code">Codigo de escuela</label>
        <input id="school-code" name="schoolCode" autocomplete="off" />
        <label class="check-row">
          <input type="checkbox" name="legal" />
          <span>Acepto el aviso de privacidad y los terminos de uso para visualizar fotografias protegidas.</span>
        </label>
        <p class="fineprint">El acceso protege la privacidad de cada escuela y sus eventos.</p>
        <div id="school-access-message" class="form-message" role="status"></div>
        <button class="btn primary full" type="submit">Continuar</button>
        <a class="btn text" href="#/">Volver al sitio publico</a>
      </form>
    </section>
  `, { noFooter: true });

  document.querySelector("#school-access-form").addEventListener("submit", (eventSubmit) => {
    eventSubmit.preventDefault();
    const message = document.querySelector("#school-access-message");
    const data = new FormData(eventSubmit.currentTarget);
    const code = normalize(data.get("schoolCode"));
    message.textContent = "Validando acceso...";
    if (!code) return showFormMessage(message, "El codigo de escuela es obligatorio.", "error");
    if (!data.get("legal")) return showFormMessage(message, "Debes aceptar los terminos para continuar.", "error");
    const school = demoSchools().find((item) => normalize(item.access_code) === code && item.status === "active");
    if (!school) return showFormMessage(message, "El código no es válido o el acceso no está disponible.", "error");
    const schoolEvents = demoEvents().filter((event) => (event.school_id || event.schoolId) === school.id && !["draft", "deleted", "disabled"].includes(event.status));
    if (!schoolEvents.length) return showFormMessage(message, "El código no es válido o el acceso no está disponible.", "error");
    setTimeout(() => {
      const current = access();
      writeJson(keys.access, { ...current, schools: { ...(current.schools || {}), [school.slug]: true } });
      showFormMessage(message, "Acceso exitoso. Abriendo escuela...", "success");
      location.hash = `#/escuela/${school.slug}`;
    }, 250);
  });
}

function renderSchoolLobby(schoolSlug) {
  const school = schoolBySlug(schoolSlug);
  const stored = access();
  if (!school || !stored.schools?.[school.slug]) return renderAccess();
  const events = demoEvents().filter((event) => (event.school_id || event.schoolId) === school.id && !["draft", "deleted", "disabled"].includes(event.status));
  app.innerHTML = shell(`
    <section class="section school-lobby">
      <div class="page-title">
        <div>
          <p class="eyebrow">Antesala privada</p>
          <h1>${escapeHtml(school.name)}</h1>
          <p>Solo se muestran eventos habilitados para esta escuela. Para abrir una galeria, valida el codigo propio del evento.</p>
        </div>
        <a class="btn secondary" href="#/acceso">Cambiar escuela</a>
      </div>
      <div class="event-list">
        ${events.map((event) => eventAccessCard(event)).join("")}
      </div>
    </section>
  `);
  document.querySelectorAll("[data-event-access]").forEach((form) => form.addEventListener("submit", handleEventAccess));
}

function eventAccessCard(event) {
  const status = effectiveEventStatus(event);
  const disabled = status === "expired" || status === "deleted" || status === "disabled";
  return `
    <article class="event-access-card">
      <div>
        <span class="status-pill ${status}">${statusLabel(status)}</span>
        <h2>${escapeHtml(event.name)}</h2>
        <p>${appConfig.eventTypes[event.event_type] || "Evento escolar"} · ${formatDate(event.event_date || event.date)}</p>
        ${status === "scheduled" ? `<p class="countdown" data-countdown="${event.publish_at}">${countdownTo(event.publish_at)}</p>` : ""}
      </div>
      <form data-event-access="${event.slug}" novalidate>
        <label>Codigo de galería<input name="eventCode" autocomplete="off" ${disabled ? "disabled" : ""} /></label>
        <div class="form-message" role="status"></div>
        <button class="btn primary full" type="submit" ${disabled ? "disabled" : ""}>Abrir evento</button>
      </form>
    </article>
  `;
}

function handleEventAccess(eventSubmit) {
  eventSubmit.preventDefault();
  const form = eventSubmit.currentTarget;
  const event = eventBySlug(form.dataset.eventAccess);
  const school = schoolById(event.school_id || event.schoolId);
  const message = form.querySelector(".form-message");
  const code = normalize(new FormData(form).get("eventCode"));
  if (!code) return showFormMessage(message, "El Codigo de galería es obligatorio.", "error");
  if (!event || code !== normalize(event.access_code || event.accessCode)) return showFormMessage(message, "El código no es válido o el acceso no está disponible.", "error");
  const status = effectiveEventStatus(event);
  if (["expired", "deleted", "disabled", "draft"].includes(status)) return showFormMessage(message, "El código no es válido o el acceso no está disponible.", "error");
  const current = access();
  writeJson(keys.access, {
    ...current,
    schools: { ...(current.schools || {}), [school.slug]: true },
    events: { ...(current.events || {}), [event.slug]: true },
  });
  grantGalleryAccess(currentUser(), event, "codigo");
  if (status === "scheduled") {
    location.hash = `#/escuela/${school.slug}/evento/${event.slug}`;
  } else {
    location.hash = `#/galeria/${event.slug}`;
  }
}

function renderGallery(slug = "festival-fin-cursos-2026") {
  state.eventSlug = slug;
  state.activeEventSlug = slug;
  const event = eventBySlug(slug) || currentEvent();
  const school = schoolById(event.school_id || event.schoolId);
  const stored = access();
  const userHasAccess = currentUser() && userAccess().some((item) => item.user_id === currentUser().id && item.event_id === event.id && !item.revoked_at);
  if (!userHasAccess && (!stored.schools?.[school.slug] || !stored.events?.[event.slug])) return renderAccess();
  const status = effectiveEventStatus(event);
  if (status === "scheduled") return renderEventWait(school.slug, event.slug);
  if (["expired", "deleted", "disabled", "draft"].includes(status)) {
    app.innerHTML = shell(`<section class="section narrow"><h1>Galeria no disponible</h1><p>Esta galeria no acepta accesos ni compras en este momento. Los pedidos existentes se conservan en administracion.</p><a class="btn primary" href="#/escuela/${school.slug}">Volver</a></section>`);
    return;
  }
  const photos = filteredPhotos(event);
  const visible = photos.slice(0, state.galleryLimit);
  const favs = favorites();
  const cartItems = cart();
  app.innerHTML = shell(`
    <section class="gallery-head">
      <div>
        <a class="back-link" href="#/escuela/${school.slug}">Volver a eventos de la escuela</a>
        <h1>${escapeHtml(event.name)}</h1>
        <p>${escapeHtml(event.schoolName)} · ${formatDate(event.date)} · ${getEventPhotos(event.id).length} fotografias · ${statusLabel(status)} · Vigente hasta ${formatDate(event.expiresAt)}</p>
      </div>
      <a class="floating-cart" href="#/carrito" aria-label="Abrir carrito">${cartItems.length} en carrito</a>
    </section>
    <section class="toolbar" aria-label="Herramientas de galeria">
      <label><span>Buscar ID</span><input id="gallery-search" value="${escapeHtml(state.query)}" placeholder="HZ26-0001" /></label>
      <div class="segments" role="group" aria-label="Categorias">
        ${["Todas", ...event.categories].map((cat) => `<button class="${state.selectedCategory === cat ? "active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`).join("")}
      </div>
    </section>
    <section class="photo-grid" aria-live="polite">
      ${visible.map((photo, index) => photoCard(photo, index, favs, cartItems)).join("")}
    </section>
    ${visible.length < photos.length ? `<div class="center-row"><button class="btn secondary" id="load-more">Cargar mas fotografias</button></div>` : ""}
    ${state.modalIndex !== null ? modalMarkup(photos, state.modalIndex, favs, cartItems) : ""}
  `);
  bindGallery(photos);
}

function renderEventWait(schoolSlug, eventSlug) {
  const school = schoolBySlug(schoolSlug);
  const event = eventBySlug(eventSlug);
  const stored = access();
  const userHasAccess = currentUser() && userAccess().some((item) => item.user_id === currentUser().id && item.event_id === event?.id && !item.revoked_at);
  if (!school || !event || (!userHasAccess && (!stored.schools?.[school.slug] || !stored.events?.[event.slug]))) return renderAccess();
  app.innerHTML = shell(`
    <section class="section narrow wait-page">
      <p class="eyebrow">Galeria programada</p>
      <h1>${escapeHtml(event.name)}</h1>
      <p>${escapeHtml(school.name)}</p>
      <div class="wait-panel">
        <h2>La galeria estará disponible próximamente</h2>
        <p>Fecha de publicación: ${formatDateTime(event.publish_at)}</p>
        <strong class="countdown big" data-countdown="${event.publish_at}">${countdownTo(event.publish_at)}</strong>
        <form id="notify-me-form" class="inline-form">
          <label>Correo o WhatsApp<input name="contact" placeholder="tu@email.com" /></label>
          <button class="btn primary" type="submit">Avisarme</button>
        </form>
        <div id="notify-me-message" class="form-message" role="status"></div>
      </div>
      <a class="btn secondary" href="#/escuela/${school.slug}">Volver</a>
    </section>
  `);
  document.querySelector("#notify-me-form").addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    const user = currentUser();
    if (user) {
      const existing = notificationSubscriptions();
      if (!existing.some((item) => item.user_id === user.id && item.event_id === event.id)) {
        setNotificationSubscriptions([...existing, { id: `sub_${Date.now()}`, user_id: user.id, event_id: event.id, email_enabled: true, whatsapp_enabled: true, consent_at: new Date().toISOString() }]);
      }
    }
    showFormMessage(document.querySelector("#notify-me-message"), "Aviso registrado correctamente.", "success");
  });
}

function filteredPhotos(event) {
  return getEventPhotos(event.id).filter((photo) => {
    const matchesCategory = state.selectedCategory === "Todas" || photo.category === state.selectedCategory;
    const matchesQuery = !state.query || photo.identifier.toLowerCase().includes(state.query.toLowerCase());
    return matchesCategory && matchesQuery;
  });
}

function photoCard(photo, index, favs, cartItems) {
  const inCart = cartItems.some((item) => item.photoId === photo.id);
  const fav = favs.includes(photo.id);
  return `
    <article class="photo-card protected-media">
      <button class="image-button" data-open="${index}" aria-label="Abrir ${photo.identifier}">
        <img src="${photoSvg(photo, "thumb")}" alt="Fotografia ${photo.identifier}, categoria ${escapeHtml(photo.category)}" loading="lazy" draggable="false" />
        <span class="watermark tile">PhotoSchool</span>
      </button>
      <div class="photo-info">
        <div><strong>${photo.identifier}</strong><span>${escapeHtml(photo.category)}</span></div>
        <button class="icon-btn ${fav ? "active" : ""}" data-fav="${photo.id}" aria-label="Favorito ${photo.identifier}">${fav ? "★" : "☆"}</button>
      </div>
      <button class="btn ${inCart ? "secondary" : "primary"} small" data-cart="${photo.id}">${inCart ? "Quitar del carrito" : "Agregar al carrito"}</button>
    </article>
  `;
}

function modalMarkup(photos, index, favs, cartItems) {
  const photo = photos[index];
  const inCart = cartItems.some((item) => item.photoId === photo.id);
  const fav = favs.includes(photo.id);
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal protected-media" data-modal>
        <button class="modal-close" data-close aria-label="Cerrar">×</button>
        <button class="modal-nav prev" data-prev aria-label="Fotografia anterior">‹</button>
        <img src="${photoSvg(photo)}" alt="Vista ampliada ${photo.identifier}" draggable="false" />
        <span class="watermark diagonal">PhotoSchool PhotoSchool PhotoSchool</span>
        <button class="modal-nav next" data-next aria-label="Fotografia siguiente">›</button>
        <div class="modal-info">
          <div><h2 id="modal-title">${photo.identifier}</h2><p>${escapeHtml(photo.category)}</p></div>
          <div class="actions compact">
            <button class="btn secondary" data-fav="${photo.id}">${fav ? "Quitar favorito" : "Favorito"}</button>
            <button class="btn primary" data-cart="${photo.id}">${inCart ? "Quitar del carrito" : "Agregar al carrito"}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindGallery(photos) {
  document.querySelectorAll(".protected-media").forEach((node) => {
    // Medidas disuasorias: en produccion los originales se serviran desde almacenamiento privado con enlaces firmados.
    node.addEventListener("contextmenu", (event) => event.preventDefault());
    node.addEventListener("dragstart", (event) => event.preventDefault());
  });
  document.querySelector("#gallery-search")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.galleryLimit = 12;
    renderGallery(state.eventSlug);
  });
  document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => {
    state.selectedCategory = button.dataset.category;
    state.galleryLimit = 12;
    renderGallery(state.eventSlug);
  }));
  document.querySelector("#load-more")?.addEventListener("click", () => {
    state.galleryLimit += 6;
    renderGallery(state.eventSlug);
  });
  document.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => {
    state.modalIndex = Number(button.dataset.open);
    renderGallery(state.eventSlug);
  }));
  document.querySelectorAll("[data-fav]").forEach((button) => button.addEventListener("click", () => toggleFavorite(button.dataset.fav)));
  document.querySelectorAll("[data-cart]").forEach((button) => button.addEventListener("click", () => toggleCart(button.dataset.cart)));
  document.querySelector("[data-close]")?.addEventListener("click", closeModal);
  document.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-backdrop")) closeModal();
  });
  document.querySelector("[data-prev]")?.addEventListener("click", () => moveModal(photos, -1));
  document.querySelector("[data-next]")?.addEventListener("click", () => moveModal(photos, 1));
  const modal = document.querySelector("[data-modal]");
  modal?.addEventListener("touchstart", (event) => { state.touchStartX = event.touches[0].clientX; }, { passive: true });
  modal?.addEventListener("touchend", (event) => {
    const diff = event.changedTouches[0].clientX - state.touchStartX;
    if (Math.abs(diff) > 60) moveModal(photos, diff > 0 ? -1 : 1);
  });
}

function toggleFavorite(photoId) {
  const favs = favorites();
  writeJson(keys.favorites, favs.includes(photoId) ? favs.filter((id) => id !== photoId) : [...favs, photoId]);
  renderRoute();
}

function toggleCart(photoId) {
  const event = currentEvent();
  if (isEventExpired(event)) return;
  const items = cart();
  const exists = items.some((item) => item.photoId === photoId);
  const next = exists
    ? items.filter((item) => item.photoId !== photoId)
    : [...items, { photoId, eventId: state.activeEventSlug, productType: "digital", printCopies: 1 }];
  writeJson(keys.cart, next);
  renderRoute();
}

function closeModal() {
  state.modalIndex = null;
  renderGallery(state.eventSlug);
}

function moveModal(photos, direction) {
  state.modalIndex = (state.modalIndex + direction + photos.length) % photos.length;
  renderGallery(state.eventSlug);
}

function renderCart() {
  const items = hydrateCart(cart());
  const config = runtimeConfig();
  const totals = calculateCartTotals(items, config);
  app.innerHTML = shell(`
    <section class="section cart-page">
      <div class="page-title">
        <div><h1>Carrito</h1><p>${volumeMessage(items, config)} ${totals.savings ? `Ahorraste ${formatMoney(totals.savings, config.pricing.currency)} en tu seleccion.` : ""}</p></div>
        <a class="btn secondary" href="#/galeria/${state.activeEventSlug}">Volver a galeria</a>
      </div>
      <div class="bulk-actions">
        <button class="btn secondary" data-apply-all="digital">Aplicar descarga digital</button>
        <button class="btn secondary" data-apply-all="print_5x7">Aplicar impresion 5x7</button>
      </div>
      ${items.length ? `
        <div class="cart-layout">
          <div class="cart-list">
            ${items.map(cartRow).join("")}
          </div>
          ${summaryBox(items, totals, true)}
        </div>` : `<p class="empty">No hay fotografias seleccionadas.</p>`}
    </section>
  `);
  bindCart();
}

function hydrateCart(items) {
  return items.map((item) => ({ ...item, photo: mockDb.photos.find((photo) => photo.id === item.photoId) })).filter((item) => item.photo);
}

function cartRow(item) {
  return `
    <article class="cart-row">
      <img src="${photoSvg(item.photo, "thumb")}" alt="Miniatura ${item.photo.identifier}" draggable="false" />
      <div><strong>${item.photo.identifier}</strong><span>${escapeHtml(item.photo.category)}</span></div>
      <label><span>Producto</span><select data-product="${item.photoId}">
        <option value="digital" ${item.productType === "digital" ? "selected" : ""}>Descarga digital</option>
        <option value="print_5x7" ${item.productType === "print_5x7" ? "selected" : ""}>Impresion 5x7</option>
      </select></label>
      <label class="${item.productType === "print_5x7" ? "" : "muted"}"><span>Copias</span><input data-copies="${item.photoId}" type="number" min="1" max="20" value="${item.printCopies || 1}" ${item.productType === "digital" ? "disabled" : ""} /></label>
      <button class="btn text danger-text" data-remove="${item.photoId}">Eliminar</button>
    </article>
  `;
}

function summaryBox(items, totals, includeContinue = false) {
  const config = runtimeConfig();
  const next = totals.nextRule ? `Siguiente rango: ${formatRuleLabel(totals.nextRule)} a ${formatMoney(totals.nextRule.unitPrice, config.pricing.currency)} por foto.` : "Rango maximo desbloqueado.";
  return `
    <aside class="summary">
      <h2>Resumen</h2>
      <dl>
        <div><dt>Rango actual</dt><dd>${totals.rangeLabel}</dd></div>
        <div><dt>Precio unitario</dt><dd>${formatMoney(totals.unitPrice, config.pricing.currency)}</dd></div>
        <div><dt>Subtotal fotos</dt><dd>${formatMoney(totals.baseSubtotal, config.pricing.currency)}</dd></div>
        <div><dt>Ahorro por volumen</dt><dd>${formatMoney(totals.savings, config.pricing.currency)}</dd></div>
        <div><dt>Adicional impresion</dt><dd>${formatMoney(totals.printAddon, config.pricing.currency)}</dd></div>
        <div class="total"><dt>Total</dt><dd>${formatMoney(totals.total, config.pricing.currency)}</dd></div>
      </dl>
      <p>${next}</p>
      ${includeContinue ? `<a class="btn primary full ${items.length ? "" : "disabled"}" href="#/checkout">Continuar</a>` : ""}
    </aside>
  `;
}

function bindCart() {
  document.querySelectorAll("[data-product]").forEach((select) => select.addEventListener("change", () => updateCartItem(select.dataset.product, { productType: select.value })));
  document.querySelectorAll("[data-copies]").forEach((input) => input.addEventListener("change", () => updateCartItem(input.dataset.copies, { printCopies: Math.max(1, Number(input.value || 1)) })));
  document.querySelectorAll("[data-remove]").forEach((button) => button.addEventListener("click", () => {
    writeJson(keys.cart, cart().filter((item) => item.photoId !== button.dataset.remove));
    renderCart();
  }));
  document.querySelectorAll("[data-apply-all]").forEach((button) => button.addEventListener("click", () => {
    const productType = button.dataset.applyAll;
    writeJson(keys.cart, cart().map((item) => ({ ...item, productType, printCopies: item.printCopies || 1 })));
    renderCart();
  }));
}

function updateCartItem(photoId, patch) {
  writeJson(keys.cart, cart().map((item) => item.photoId === photoId ? { ...item, ...patch } : item));
  renderCart();
}

function renderCheckout() {
  const items = hydrateCart(cart());
  const config = runtimeConfig();
  const totals = calculateCartTotals(items, config);
  const hasPrints = items.some((item) => item.productType === "print_5x7");
  if (!items.length) return renderCart();
  app.innerHTML = shell(`
    <section class="section checkout">
      <div class="page-title"><h1>Finalizar pedido</h1><p>Revisa tu selección y confirma tus datos para continuar.</p></div>
      <form id="checkout-form" class="checkout-grid" novalidate>
        <div class="form-panel">
          <label>Nombre completo<input name="name" autocomplete="name" /></label>
          <label>Correo electronico<input name="email" autocomplete="email" inputmode="email" /></label>
          <label>WhatsApp<input name="phone" autocomplete="tel" inputmode="tel" /></label>
          <label>Escuela o evento<input name="event" value="${escapeHtml(currentEvent().name)}" readonly /></label>
          ${hasPrints ? `<div class="readonly-field"><span>Metodo de entrega</span><strong>${escapeHtml(config.delivery.printDeliveryLabel)}</strong></div><p class="fineprint">${escapeHtml(config.delivery.printDeliveryNote)}</p>` : `<p class="fineprint">Las descargas digitales se habilitaran durante ${config.lifecycle.downloadAvailabilityDays} dias despues de confirmarse el pago.</p>`}
          <fieldset>
            <legend>Metodo de pago</legend>
            ${config.payments.methods.map((method) => `<label class="radio-row"><input type="radio" name="payment" value="${method.id}" /> <span>${escapeHtml(method.label)}</span></label>`).join("")}
          </fieldset>
          <label class="check-row"><input type="checkbox" name="terms" /> <span>Acepto el resumen del pedido y los terminos de compra.</span></label>
          <div id="checkout-message" class="form-message" role="status"></div>
          <button class="btn primary full" type="submit">Confirmar pedido</button>
        </div>
        ${summaryBox(items, totals)}
      </form>
    </section>
  `);
  document.querySelector("#checkout-form").addEventListener("submit", handleCheckout);
}

function handleCheckout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const message = document.querySelector("#checkout-message");
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  if (!name) return showFormMessage(message, "El nombre completo es obligatorio.", "error");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showFormMessage(message, "Ingresa un correo valido.", "error");
  if (!/^[0-9+\s()-]{8,20}$/.test(phone)) return showFormMessage(message, "Ingresa un WhatsApp valido.", "error");
  if (!data.get("payment")) return showFormMessage(message, "Selecciona un metodo de pago.", "error");
  if (!data.get("terms")) return showFormMessage(message, "Debes aceptar el resumen y terminos.", "error");
  const items = hydrateCart(cart());
  const config = runtimeConfig();
  const totals = calculateCartTotals(items, config);
  const method = config.payments.methods.find((item) => item.id === data.get("payment"));
  const order = {
    id: `order_${Date.now()}`,
    orderNumber: `PS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    eventId: currentEvent().id,
    eventName: currentEvent().name,
    createdAt: new Date().toISOString(),
    photoCount: items.length,
    deliveryType: items.some((item) => item.productType === "print_5x7") ? config.delivery.printDeliveryLabel : "Descarga digital",
    total: totals.total,
    paymentMethod: method.label,
    paymentStatus: method.statusAfterConfirm,
    preparationStatus: "Nuevo",
    items: items.map((item) => ({
      photoId: item.photo.identifier,
      productType: item.productType === "print_5x7" ? "Impresion 5x7" : "Descarga digital",
      printCopies: item.productType === "print_5x7" ? Math.max(1, Number(item.printCopies || 1)) : 0,
    })),
  };
  writeJson(keys.orders, [...readJson(keys.orders, []), order]);
  writeJson(keys.cart, []);
  sessionStorage.setItem("photoschool_last_order", JSON.stringify(order));
  location.hash = "#/confirmacion";
}

function renderConfirmation() {
  const config = runtimeConfig();
  const order = JSON.parse(sessionStorage.getItem("photoschool_last_order") || "null");
  if (!order) {
    app.innerHTML = shell(`<section class="section narrow"><h1>Pedido no encontrado</h1><a class="btn primary" href="#/galeria/${state.activeEventSlug}">Volver a galeria</a></section>`);
    return;
  }
  const hasPrints = order.items.some((item) => item.printCopies > 0);
  app.innerHTML = shell(`
    <section class="section confirmation">
      <p class="eyebrow">Pedido generado</p>
      <h1>${order.orderNumber}</h1>
      <dl class="confirm-grid">
        <div><dt>Cliente</dt><dd>${escapeHtml(order.customerName)}</dd></div>
        <div><dt>Evento</dt><dd>${escapeHtml(order.eventName)}</dd></div>
        <div><dt>Fotografias</dt><dd>${order.photoCount}</dd></div>
        <div><dt>Total</dt><dd>${formatMoney(order.total, config.pricing.currency)}</dd></div>
        <div><dt>Pago</dt><dd>${escapeHtml(order.paymentMethod)} · ${escapeHtml(order.paymentStatus)}</dd></div>
        <div><dt>Entrega</dt><dd>${escapeHtml(order.deliveryType)}</dd></div>
      </dl>
      <section class="next-steps">
        <h2>Proximos pasos</h2>
        ${hasPrints ? `<p>Impresiones por ${escapeHtml(config.delivery.printDeliveryLabel.toLowerCase())}. ${escapeHtml(config.delivery.printDeliveryNote)}</p>` : `<p>Las descargas se habilitaran despues de confirmarse el pago y estaran disponibles durante ${config.lifecycle.downloadAvailabilityDays} dias mediante enlaces temporales.</p>`}
        <ul>${order.items.map((item) => `<li>${escapeHtml(item.photoId)} · ${escapeHtml(item.productType)}${item.printCopies ? ` · ${item.printCopies} copia(s)` : ""}</li>`).join("")}</ul>
      </section>
      <div class="actions">
        <button class="btn secondary" onclick="window.print()">Descargar comprobante</button>
        <a class="btn secondary" href="/admin?view=orders">Ver mi pedido</a>
        <a class="btn primary" href="#/galeria/${state.activeEventSlug}">Volver a la galeria</a>
      </div>
    </section>
  `);
}

function renderLogin() {
  app.innerHTML = shell(`
    <section class="section narrow">
      <form id="user-login" class="form-panel" novalidate>
        <p class="eyebrow">Cuenta familiar</p>
        <h1>Iniciar sesión</h1>
        <p class="fineprint">Accede para consultar tus galerias, compras, descargas y avisos.</p>
        <label>Correo<input name="email" autocomplete="email" /></label>
        <label>Contraseña<input name="password" type="password" autocomplete="current-password" /></label>
        <div id="login-message" class="form-message" role="status"></div>
        <button class="btn primary full" type="submit">Entrar</button>
        <a class="btn text" href="#/registro">Crear cuenta</a>
        <a class="btn text" href="#/recuperar">Recuperar contraseña</a>
      </form>
    </section>
  `);
  document.querySelector("#user-login").addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    const data = new FormData(submitEvent.currentTarget);
    const user = demoUsers().find((item) => item.email.toLowerCase() === String(data.get("email")).trim().toLowerCase());
    if (!user || String(data.get("password")) !== "familia2026") return showFormMessage(document.querySelector("#login-message"), "No pudimos iniciar sesión con esos datos.", "error");
    setUserSession({ userId: user.id, loggedAt: new Date().toISOString() });
    location.hash = "#/cuenta";
  });
}

function renderRegister() {
  app.innerHTML = shell(`
    <section class="section narrow">
      <form id="user-register" class="form-panel" novalidate>
        <p class="eyebrow">Registro</p>
        <h1>Crear cuenta</h1>
        <label>Nombre<input name="first_name" /></label>
        <label>Apellidos<input name="last_name" /></label>
        <label>Correo<input name="email" inputmode="email" /></label>
        <label>WhatsApp<input name="phone" inputmode="tel" /></label>
        <label>Contraseña<input name="password" type="password" /></label>
        <label>Confirmar contraseña<input name="confirm" type="password" /></label>
        <label class="check-row"><input type="checkbox" name="privacy" /> <span>Acepto el aviso de privacidad.</span></label>
        <label class="check-row"><input type="checkbox" name="notify" /> <span>Acepto recibir avisos de galerías por correo y WhatsApp.</span></label>
        <div id="register-message" class="form-message" role="status"></div>
        <button class="btn primary full" type="submit">Crear cuenta</button>
      </form>
    </section>
  `);
  document.querySelector("#user-register").addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    const data = Object.fromEntries(new FormData(submitEvent.currentTarget).entries());
    const msg = document.querySelector("#register-message");
    if (!data.first_name || !data.last_name || !data.email || !data.phone || !data.password) return showFormMessage(msg, "Completa los campos obligatorios.", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return showFormMessage(msg, "Ingresa un correo válido.", "error");
    if (data.password !== data.confirm) return showFormMessage(msg, "Las contraseñas no coinciden.", "error");
    if (!data.privacy) return showFormMessage(msg, "Debes aceptar el aviso de privacidad.", "error");
    const user = {
      id: `user_${Date.now()}`,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      password_hash_placeholder: "hash_placeholder_no_productivo",
      email_verified: false,
      phone_verified: false,
      notification_email: Boolean(data.notify),
      notification_whatsapp: Boolean(data.notify),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setDemoUsers([...demoUsers(), user]);
    setUserSession({ userId: user.id, loggedAt: new Date().toISOString() });
    location.hash = "#/cuenta";
  });
}

function renderRecover() {
  app.innerHTML = shell(`
    <section class="section narrow">
      <form id="recover-form" class="form-panel">
        <p class="eyebrow">Recuperación de cuenta</p>
        <h1>Recuperar contraseña</h1>
        <label>Correo<input name="email" inputmode="email" /></label>
        <div id="recover-message" class="form-message" role="status"></div>
        <button class="btn primary full" type="submit">Enviar instrucciones</button>
      </form>
    </section>
  `);
  document.querySelector("#recover-form").addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    showFormMessage(document.querySelector("#recover-message"), "Si el correo está registrado, recibirás instrucciones para recuperar tu acceso.", "success");
  });
}

function renderUserDashboard() {
  const user = currentUser();
  if (!user) return renderLogin();
  const view = new URLSearchParams((location.hash.split("?")[1] || "")).get("view") || state.userView;
  state.userView = view;
  app.innerHTML = shell(`
    <section class="user-layout">
      <aside class="user-nav">
        <p class="eyebrow">Mi cuenta</p>
        <h1>${escapeHtml(user.first_name)}</h1>
        ${["galleries", "upcoming", "orders", "downloads", "prints", "favorites", "notifications", "profile"].map((item) => `<a class="${view === item ? "active" : ""}" href="#/cuenta?view=${item}">${userLabel(item)}</a>`).join("")}
        <button class="btn text" id="user-logout-side">Cerrar sesión</button>
      </aside>
      <div class="user-content">${userContent(user, view)}</div>
    </section>
  `, { noFooter: true });
  bindUserDashboard(user);
}

function userContent(user, view) {
  const accessItems = userAccess().filter((item) => item.user_id === user.id && !item.revoked_at);
  const events = accessItems.map((item) => eventById(item.event_id)).filter(Boolean);
  if (view === "galleries") return `<h2>Mis galerías</h2><div class="dashboard-grid">${events.filter((event) => ["active", "reactivated"].includes(effectiveEventStatus(event))).map((event) => userGalleryCard(event)).join("") || `<p class="empty">Aún no tienes galerías activas asociadas.</p>`}</div>`;
  if (view === "upcoming") return `<h2>Próximas galerías</h2><div class="dashboard-grid">${events.filter((event) => effectiveEventStatus(event) === "scheduled").map((event) => userUpcomingCard(user, event)).join("") || `<p class="empty">No hay galerías programadas.</p>`}</div>`;
  if (view === "orders") return `<h2>Mis compras</h2><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Evento</th><th>Escuela</th><th>Total</th><th>Pago</th><th>Estado</th></tr></thead><tbody>${savedOrders().filter((order) => order.customerEmail === user.email).map((order) => `<tr><td>${order.orderNumber}</td><td>${escapeHtml(order.eventName)}</td><td>${escapeHtml(order.schoolName || "")}</td><td>${formatMoney(order.total)}</td><td>${escapeHtml(order.paymentStatus)}</td><td>${escapeHtml(order.preparationStatus)}</td></tr>`).join("")}</tbody></table></div>`;
  if (view === "downloads") return `<h2>Descargas</h2><div class="dashboard-grid">${mockDb.downloads.filter((item) => item.user_id === user.id).map((download) => `<article class="metric"><span>${escapeHtml(eventById(download.event_id)?.name || "Evento")}</span><strong>${statusLabel(download.status) || "Disponible"}</strong><p>Expira: ${formatDateTime(download.expires_at)} · ${Math.max(0, Math.ceil((new Date(download.expires_at) - new Date()) / 86400000))} días restantes</p><button class="btn secondary">Descargar</button></article>`).join("")}</div>`;
  if (view === "prints") return `<h2>Impresiones</h2><div class="dashboard-grid">${mockDb.print_jobs.filter((item) => item.user_id === user.id).map((job) => `<article class="metric"><span>${escapeHtml(eventById(job.event_id)?.name || "Evento")}</span><strong>Listo para recoger</strong><p>Recolección personal. Alberto se pondrá en contacto contigo para coordinar la entrega.</p></article>`).join("")}</div>`;
  if (view === "favorites") return `<h2>Favoritos</h2><div class="photo-grid">${favorites().map((photoId) => mockDb.photos.find((photo) => photo.id === photoId)).filter(Boolean).map((photo, index) => photoCard(photo, index, favorites(), cart())).join("") || `<p class="empty">No hay favoritos guardados.</p>`}</div>`;
  if (view === "notifications") {
    const config = runtimeConfig();
    return `<h2>Notificaciones</h2><div class="table-wrap"><table><thead><tr><th>Tipo</th><th>Canal</th><th>Mensaje</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${demoNotifications().filter((notification) => notification.user_id === user.id).map((notification) => `<tr><td>${config.notifications.types[notification.type]}</td><td>${config.notifications.channels[notification.channel]}</td><td>${escapeHtml(notification.template)}</td><td>${notification.read_at ? "Leída" : "Nueva"}</td><td><button class="btn small secondary" data-read-notification="${notification.id}">Marcar leída</button></td></tr>`).join("")}</tbody></table></div>`;
  }
  return `<h2>Perfil</h2><div class="form-panel"><p><strong>${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</strong></p><p>${escapeHtml(user.email)} · ${escapeHtml(user.phone)}</p><p>Notificaciones: correo ${user.notification_email ? "activo" : "inactivo"}, WhatsApp ${user.notification_whatsapp ? "activo" : "inactivo"}.</p></div>`;
}

function userGalleryCard(event) {
  const school = schoolById(event.school_id || event.schoolId);
  const status = effectiveEventStatus(event);
  const days = Math.max(0, Math.ceil((new Date(event.expires_at) - new Date()) / 86400000));
  return `<article class="metric">
    <span>${escapeHtml(school?.name || "")}</span>
    <strong>${escapeHtml(event.name)}</strong>
    <p>${statusLabel(status)} · Expira ${formatDate(event.expiresAt)} · ${days} días restantes</p>
    <a class="btn primary" href="#/galeria/${event.slug}">Acceder</a>
  </article>`;
}

function userUpcomingCard(user, event) {
  const sub = notificationSubscriptions().find((item) => item.user_id === user.id && item.event_id === event.id);
  return `<article class="metric">
    <span>${escapeHtml(schoolById(event.school_id)?.name || "")}</span>
    <strong>${escapeHtml(event.name)}</strong>
    <p>Publicación: ${formatDateTime(event.publish_at)}</p>
    <p class="countdown" data-countdown="${event.publish_at}">${countdownTo(event.publish_at)}</p>
    <button class="btn secondary" data-toggle-subscription="${event.id}">${sub ? "Aviso activo" : "Avisarme"}</button>
  </article>`;
}

function bindUserDashboard(user) {
  document.querySelector("#user-logout-side")?.addEventListener("click", logoutUser);
  document.querySelectorAll("[data-toggle-subscription]").forEach((button) => button.addEventListener("click", () => {
    const eventId = button.dataset.toggleSubscription;
    const existing = notificationSubscriptions();
    const found = existing.find((item) => item.user_id === user.id && item.event_id === eventId);
    if (found) {
      setNotificationSubscriptions(existing.filter((item) => item.id !== found.id));
    } else {
      setNotificationSubscriptions([...existing, { id: `sub_${Date.now()}`, user_id: user.id, event_id: eventId, email_enabled: true, whatsapp_enabled: true, consent_at: new Date().toISOString() }]);
    }
    renderUserDashboard();
  }));
  document.querySelectorAll("[data-read-notification]").forEach((button) => button.addEventListener("click", () => {
    setDemoNotifications(demoNotifications().map((notification) => notification.id === button.dataset.readNotification ? { ...notification, read_at: new Date().toISOString() } : notification));
    renderUserDashboard();
  }));
  document.querySelectorAll("[data-cart]").forEach((button) => button.addEventListener("click", () => toggleCart(button.dataset.cart)));
}

function userLabel(item) {
  return {
    galleries: "Mis galerías",
    upcoming: "Próximas galerías",
    orders: "Mis compras",
    downloads: "Descargas",
    prints: "Impresiones",
    favorites: "Favoritos",
    notifications: "Notificaciones",
    profile: "Perfil",
  }[item];
}

function logoutUser() {
  localStorage.removeItem(keys.userSession);
  location.hash = "#/";
}

function renderAdmin() {
  if (!state.adminAuthed) return renderAdminLogin();
  const view = new URLSearchParams((state.route.split("?")[1] || "")).get("view") || state.adminView;
  state.adminView = view;
  app.innerHTML = shell(`
    <section class="admin-layout">
      <aside class="admin-nav">
        <span class="admin-logo"><img src="${brandLogo}" alt="Alberto de la Fuente Fotografo" /></span>
        <p class="eyebrow">Administración</p>
        ${["dashboard", "schools", "events", "galleries", "public", "photos", "orders", "customers", "notifications", "pricing", "settings"].map((item) => `<a class="${view === item ? "active" : ""}" href="/admin?view=${item}">${adminLabel(item)}</a>`).join("")}
        <button class="btn text" id="admin-logout">Salir</button>
      </aside>
      <div class="admin-content">${adminContent(view)}</div>
    </section>
  `, { noFooter: true });
  bindAdmin(view);
}

function renderAdminLogin() {
  app.innerHTML = shell(`
    <section class="section narrow">
      <form id="admin-login" class="form-panel" novalidate>
        <p class="eyebrow">Acceso administrativo</p>
        <h1>Panel administrativo</h1>
        <label>Usuario<input name="username" autocomplete="username" /></label>
        <label>Contrasena<input name="password" type="password" autocomplete="current-password" /></label>
        <div id="admin-message" class="form-message" role="status"></div>
        <button class="btn primary full" type="submit">Entrar</button>
      </form>
    </section>
  `);
  document.querySelector("#admin-login").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const config = runtimeConfig();
    if (String(data.get("username")).trim() === config.access.adminUsername && data.get("password") === config.access.adminPassword) {
      state.adminAuthed = true;
      writeJson("photoschool_demo_admin_auth", true);
      renderAdmin();
    } else {
      showFormMessage(document.querySelector("#admin-message"), "Credenciales incorrectas.", "error");
    }
  });
}

function adminContent(view) {
  const config = runtimeConfig();
  const events = demoEvents();
  const schools = demoSchools();
  const orders = savedOrders();
  const active = events.filter((event) => !isEventExpired(event) && event.status === "active");
  const expired = events.filter((event) => isEventExpired(event));
  if (view === "dashboard") return `
    <h2>Dashboard</h2>
    <div class="metric-grid">
      ${metric("Eventos activos", active.length)}
      ${metric("Fotografias publicadas", mockDb.photos.length)}
      ${metric("Pedidos recibidos", orders.length)}
      ${metric("Ventas", formatMoney(orders.reduce((sum, order) => sum + Number(order.total || 0), 0), config.pricing.currency))}
      ${metric("Descargas pendientes", orders.filter((order) => order.deliveryType === "Descarga digital").length)}
      ${metric("Impresiones pendientes", orders.filter((order) => order.deliveryType === config.delivery.printDeliveryLabel).length)}
      ${metric("Almacenamiento estimado", `${events.reduce((sum, event) => sum + Number(event.estimatedStorageGb || 0), 0)} GB`)}
      ${metric("Galerias vencidas", expired.length)}
    </div>`;
  if (view === "schools") return `
    <div class="admin-top"><h2>Escuelas</h2><button class="btn primary" id="create-school">Crear escuela</button></div>
    <div class="toolbar admin-toolbar">
      <label><span>Buscar escuela</span><input id="school-search" placeholder="Buscar" /></label>
      <label><span>Estado</span><select id="school-filter"><option value="all">Todas</option><option value="active">Activas</option><option value="inactive">Inactivas</option></select></label>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Escuela</th><th>Código escuela</th><th>Estado</th><th>Eventos</th><th>Acciones</th></tr></thead><tbody id="schools-body">
      ${schools.map((school) => schoolRow(school, events)).join("")}
    </tbody></table></div>
    <form class="form-panel admin-form" id="school-form">
      <h3>Crear escuela</h3>
      <label>Nombre<input name="name" value="Colegio Nuevo" /></label>
      <label>Slug<input name="slug" value="colegio-nuevo" /></label>
      <label>Código de escuela<input name="access_code" value="${generateSchoolCode("Colegio Nuevo")}" /></label>
      <label>Contacto<input name="contact_name" value="Contacto autorizado" /></label>
      <label>Portada<input name="cover_image" value="assets/hero.png" /></label>
      <button class="btn primary" type="submit">Guardar escuela</button>
    </form>`;
  if (view === "events") return `
    <div class="admin-top"><h2>Eventos</h2><button class="btn primary" id="create-event">Crear evento</button></div>
    <div class="table-wrap"><table><thead><tr><th>Evento</th><th>Escuela</th><th>Código evento</th><th>Publicación</th><th>Vence</th><th>Estado</th><th>Cuenta regresiva</th><th>Acciones</th></tr></thead><tbody>
      ${events.map((event) => eventAdminRow(event)).join("")}
    </tbody></table></div>
    <form class="form-panel admin-form" id="event-form">
      <h3>Crear / editar evento</h3>
      <label>Nombre del evento<input name="name" value="Nuevo evento escolar" /></label>
      <label>Escuela<select name="school_id">${schools.map((school) => `<option value="${school.id}">${escapeHtml(school.name)}</option>`).join("")}</select></label>
      <label>Slug<input name="slug" value="nuevo-evento-escolar" /></label>
      <label>Codigo de galería<input name="access_code" value="EVENTO26" /></label>
      <label>Tipo de evento<select name="event_type">${Object.entries(config.eventTypes).map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select></label>
      <label>Estado<select name="status"><option value="draft">Borrador</option><option value="scheduled">Programada</option><option value="active">Activa</option></select></label>
      <label>Fecha<input name="date" type="date" value="2026-08-01" /></label>
      <label>Publicacion<input name="publish_at" type="datetime-local" value="2026-08-01T08:00" /></label>
      <label>Vencimiento<input name="expires_at" type="datetime-local" value="2026-10-01T23:59" /></label>
      <label>Imagen de portada<input name="coverTone" value="cyan" /></label>
      <label>Categorias<input name="categories" value="Ceremonia, Individuales, Familia" /></label>
      <label>Observaciones<textarea name="notes">Evento creado desde el panel administrativo.</textarea></label>
      <button class="btn primary" type="submit">Guardar evento</button>
      <p class="fineprint">Acceso privado: ${escapeHtml(config.brand.plannedDomain)}/#/acceso · QR visual para distribuir el acceso.</p>
      <div class="qr">QR</div>
    </form>`;
  if (view === "galleries") return `<h2>Galerias privadas</h2><div class="table-wrap"><table><thead><tr><th>Galeria</th><th>Tipo</th><th>Fotos</th><th>Publicacion</th><th>Vence</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${demoGalleries().map((gallery) => `<tr><td>${escapeHtml(gallery.title || gallery.id)}</td><td>${config.galleryTypes[gallery.type] || gallery.type}</td><td>${gallery.photoCount}</td><td>${formatDateTime(gallery.publish_at)}</td><td>${formatDate(gallery.expiresAt)}</td><td>${statusLabel(gallery.status)}</td><td><button class="btn small secondary" data-reactivate-gallery="${gallery.id}">Reactivar galería</button> <button class="btn small secondary" data-disable-gallery="${gallery.id}">Desactivar</button></td></tr>`).join("")}</tbody></table></div><p class="fineprint">Estructura preparada para original privado, vista protegida, miniatura, identificador, metadatos y publicacion.</p>`;
  if (view === "public") return `
    <div class="admin-top"><h2>Galerías públicas</h2><button class="btn primary" id="create-public-gallery">Crear galería pública</button></div>
    <div class="table-wrap"><table><thead><tr><th>Título</th><th>Categoría</th><th>Tipo</th><th>Estado</th><th>Destacada</th><th>CTA</th><th>Acciones</th></tr></thead><tbody>${publicGalleries().map((gallery) => `<tr><td>${escapeHtml(gallery.title)}</td><td>${escapeHtml(gallery.category)}</td><td>${config.galleryTypes[gallery.type]}</td><td>${statusLabel(gallery.status)}</td><td>${gallery.featured ? "Sí" : "No"}</td><td>${escapeHtml(gallery.cta)}</td><td><button class="btn small secondary" data-toggle-public="${gallery.id}">${gallery.status === "active" ? "Ocultar" : "Publicar"}</button> <button class="btn small secondary" data-delete-public="${gallery.id}">Eliminar</button></td></tr>`).join("")}</tbody></table></div>
    <form class="form-panel admin-form" id="public-gallery-form">
      <h3>Crear galería pública</h3>
      <label>Título<input name="title" value="Evento Escolar 2026" /></label>
      <label>Categoría<input name="category" value="Actividades escolares" /></label>
      <label>Descripción<textarea name="description">Muestra pública autorizada para portafolio.</textarea></label>
      <label>CTA<input name="cta" value="WhatsApp" /></label>
      <label>Publicación<input name="publish_at" type="datetime-local" value="2026-08-01T08:00" /></label>
      <button class="btn primary" type="submit">Guardar galería pública</button>
    </form>`;
  if (view === "photos") return `<h2>Fotografias</h2><div class="upload-panel"><button class="btn secondary" id="simulate-upload">Preparar carga masiva</button><progress id="upload-progress" max="100" value="0"></progress></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Categoria</th><th>Publicada</th><th>Marca de agua</th><th>Accion</th></tr></thead><tbody>${mockDb.photos.map((photo) => `<tr><td>${photo.identifier}</td><td>${photo.category}</td><td>${photo.published ? "Si" : "No"}</td><td>${photo.watermarkStatus}</td><td><button class="btn small secondary" data-confirm-photo="${photo.id}">Eliminar</button></td></tr>`).join("")}</tbody></table></div>`;
  if (view === "orders") return `<h2>Pedidos</h2><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Evento</th><th>Fotos</th><th>Total</th><th>Pago</th><th>Preparacion</th><th>Detalle</th></tr></thead><tbody>${orders.map((order) => `<tr><td>${order.orderNumber}</td><td>${escapeHtml(order.customerName)}</td><td>${escapeHtml(order.eventName)}</td><td>${order.photoCount}</td><td>${formatMoney(order.total, config.pricing.currency)}</td><td>${escapeHtml(order.paymentStatus)}</td><td>${escapeHtml(order.preparationStatus)}</td><td>${order.items.map((item) => `${item.photoId}${item.printCopies ? ` (${item.printCopies})` : ""}`).join(", ")}</td></tr>`).join("")}</tbody></table></div>`;
  if (view === "customers") return `<h2>Clientes</h2><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th></tr></thead><tbody>${mockDb.customers.map((customer) => `<tr><td>${escapeHtml(customer.name)}</td><td>${escapeHtml(customer.email)}</td></tr>`).join("")}</tbody></table></div>`;
  if (view === "notifications") return `<h2>Notificaciones</h2><div class="table-wrap"><table><thead><tr><th>Canal</th><th>Destinatario</th><th>Evento</th><th>Plantilla</th><th>Estado</th><th>Motivo</th><th>Intentos</th><th>Accion</th></tr></thead><tbody>${demoNotifications().map((notification) => notificationRow(notification)).join("")}</tbody></table></div>`;
  if (view === "pricing") return renderPricingSettings(config);
  return renderGeneralSettings(config);
}

function settingsFields(config, compact = false) {
  const settings = editableSettingsFromConfig(config);
  const options = config.settingsOptions;
  const [tierOne, tierTwo, tierThree] = settings.pricing.volumeRules;
  return `
    ${compact ? "" : `
      <label>Dominio previsto<input name="planned_domain" value="${escapeHtml(settings.brand.plannedDomain)}" /></label>
      <label>Zona horaria<select name="timezone">${optionTags(options.timezones, settings.timezone)}</select></label>
    `}
    <label>Precio 1 a 5 fotos<input name="tier_1_5" type="number" min="0" value="${tierOne.unitPrice}" /></label>
    <label>Precio 6 a 10 fotos<input name="tier_6_10" type="number" min="0" value="${tierTwo.unitPrice}" /></label>
    <label>Precio desde 11 fotos<input name="tier_11_plus" type="number" min="0" value="${tierThree.unitPrice}" /></label>
    <label>Adicional impresión por copia<input name="print_addon" type="number" min="0" value="${settings.pricing.printAddonPerCopy}" /></label>
    ${compact ? "" : `
      <label>Vigencia de galería<select name="gallery_months">${optionTags(options.galleryValidityMonths, settings.lifecycle.galleryValidityMonths)}</select></label>
      <label>Días de descarga tras pago<select name="download_days">${optionTags(options.downloadAvailabilityDays, settings.lifecycle.downloadAvailabilityDays)}</select></label>
      <label>Pago principal<select name="primary_payment">${optionTags(options.paymentMethods, settings.payments.primary)}</select></label>
      <label>Pago alternativo<select name="alternative_payment">${optionTags(options.paymentMethods, settings.payments.alternative)}</select></label>
      <label>Entrega de impresiones<select name="delivery_type">${optionTags(options.printDeliveryTypes, settings.delivery.printDeliveryType)}</select></label>
      <div class="readonly-field"><span>Texto de entrega</span><strong>${escapeHtml(settings.delivery.printDeliveryNote)}</strong></div>
    `}
  `;
}

function hiddenSettingsFields(config) {
  const settings = editableSettingsFromConfig(config);
  return `
    <input type="hidden" name="planned_domain" value="${escapeHtml(settings.brand.plannedDomain)}" />
    <input type="hidden" name="timezone" value="${escapeHtml(settings.timezone)}" />
    <input type="hidden" name="gallery_months" value="${settings.lifecycle.galleryValidityMonths}" />
    <input type="hidden" name="download_days" value="${settings.lifecycle.downloadAvailabilityDays}" />
    <input type="hidden" name="primary_payment" value="${escapeHtml(settings.payments.primary)}" />
    <input type="hidden" name="alternative_payment" value="${escapeHtml(settings.payments.alternative)}" />
    <input type="hidden" name="delivery_type" value="${escapeHtml(settings.delivery.printDeliveryType)}" />
  `;
}

function renderPricingSettings(config) {
  return `
    <h2>Precios</h2>
    <div class="rules">${config.pricing.volumeRules.map((rule) => `<article><strong>${formatRuleLabel(rule)}</strong><span>${formatMoney(rule.unitPrice, config.pricing.currency)} por foto</span></article>`).join("")}<article><strong>Impresion 5x7</strong><span>${formatMoney(config.pricing.printAddonPerCopy, config.pricing.currency)} adicionales por copia</span></article></div>
    <form class="form-panel admin-form settings-form" id="pricing-form">
      <h3>Editar precios</h3>
      ${hiddenSettingsFields(config)}
      ${settingsFields(config, true)}
      <div id="pricing-message" class="form-message" role="status"></div>
      <button class="btn primary" type="submit">Guardar precios</button>
    </form>
  `;
}

function renderGeneralSettings(config) {
  return `
    <h2>Configuracion</h2>
    <form class="form-panel admin-form settings-form" id="settings-form">
      <h3>Configuración general</h3>
      ${settingsFields(config)}
      <div class="readonly-field"><span>Tipo de acceso</span><strong>Escuela y evento</strong></div>
      <div class="readonly-field"><span>Métodos de pago activos</span><strong>${config.payments.methods.map((method) => escapeHtml(method.label)).join(" y ")}</strong></div>
      <div id="settings-message" class="form-message" role="status"></div>
      <button class="btn primary" type="submit">Guardar configuración</button>
      <button class="btn secondary" type="button" id="reset-settings">Restablecer valores base</button>
    </form>
    <dl class="confirm-grid">
      <div><dt>Acceso</dt><dd>Codigo de escuela y codigo de evento</dd></div>
      <div><dt>Vigencia galeria</dt><dd>${config.lifecycle.galleryValidityMonths} meses</dd></div>
      <div><dt>Descargas</dt><dd>${config.lifecycle.downloadAvailabilityDays} dias despues del pago</dd></div>
      <div><dt>Pago principal</dt><dd>${escapeHtml(config.payments.methods[0].label)}</dd></div>
      <div><dt>Pago alternativo</dt><dd>${escapeHtml(config.payments.methods[1].label)}</dd></div>
      <div><dt>Entrega impresiones</dt><dd>${escapeHtml(config.delivery.printDeliveryLabel)}</dd></div>
    </dl>
  `;
}

function bindAdmin(view) {
  document.querySelector("#admin-logout")?.addEventListener("click", () => {
    state.adminAuthed = false;
    writeJson("photoschool_demo_admin_auth", false);
    renderAdmin();
  });
  document.querySelector("#settings-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await persistSettings(settingsFromForm(event.currentTarget));
    showFormMessage(document.querySelector("#settings-message"), "Configuración guardada.", "success");
    setTimeout(renderAdmin, 250);
  });
  document.querySelector("#pricing-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await persistSettings(settingsFromForm(event.currentTarget));
    showFormMessage(document.querySelector("#pricing-message"), "Precios guardados.", "success");
    setTimeout(renderAdmin, 250);
  });
  document.querySelector("#reset-settings")?.addEventListener("click", () => {
    if (!confirm("Restablecer la configuración base?")) return;
    localStorage.removeItem(keys.appSettings);
    renderAdmin();
  });
  document.querySelector("#event-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const config = runtimeConfig();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const school = schoolById(data.school_id) || demoSchools()[0];
    const newEvent = {
      id: `event_${Date.now()}`,
      schoolId: school.id,
      school_id: school.id,
      ...data,
      accessCode: data.access_code,
      event_date: data.date,
      publishDate: data.publish_at.slice(0, 10),
      publish_at: new Date(data.publish_at).toISOString(),
      expiresAt: data.expires_at.slice(0, 10),
      expires_at: new Date(data.expires_at).toISOString(),
      schoolName: school.name,
      accessType: config.access.type,
      categories: data.categories.split(",").map((item) => item.trim()).filter(Boolean),
      privateUrl: `${config.brand.plannedDomain}/#/acceso`,
      estimatedStorageGb: 0,
      files_available: true,
      public_visibility: false,
      gallery_id: `gallery_${Date.now()}`,
      deletionAuditStatus: "programada_al_vencer",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setDemoEvents([...demoEvents(), newEvent]);
    setDemoGalleries([...demoGalleries(), {
      id: newEvent.gallery_id,
      eventId: newEvent.id,
      event_id: newEvent.id,
      school_id: school.id,
      type: "private",
      title: newEvent.name,
      slug: newEvent.slug,
      status: newEvent.status,
      photoCount: 0,
      expiresAt: newEvent.expiresAt,
      expires_at: newEvent.expires_at,
      publish_at: newEvent.publish_at,
      featured: false,
      files_available: true,
    }]);
    renderAdmin();
  });
  document.querySelector("#school-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setDemoSchools([...demoSchools(), {
      id: `school_${Date.now()}`,
      ...data,
      status: "active",
      logo: "assets/logo.png",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]);
    renderAdmin();
  });
  document.querySelectorAll("[data-toggle-school]").forEach((button) => button.addEventListener("click", () => {
    setDemoSchools(demoSchools().map((school) => school.id === button.dataset.toggleSchool ? { ...school, status: school.status === "active" ? "inactive" : "active" } : school));
    renderAdmin();
  }));
  document.querySelectorAll("[data-regenerate-school]").forEach((button) => button.addEventListener("click", () => {
    if (!confirm("Regenerar el codigo de escuela? El codigo anterior dejará de funcionar.")) return;
    setDemoSchools(demoSchools().map((school) => school.id === button.dataset.regenerateSchool ? { ...school, access_code: generateSchoolCode(school.name), updated_at: new Date().toISOString() } : school));
    renderAdmin();
  }));
  document.querySelectorAll("[data-toggle-event]").forEach((button) => button.addEventListener("click", () => {
    setDemoEvents(demoEvents().map((event) => event.id === button.dataset.toggleEvent ? { ...event, status: event.status === "active" ? "inactive" : "active" } : event));
    renderAdmin();
  }));
  document.querySelectorAll("[data-publish-now]").forEach((button) => button.addEventListener("click", () => {
    if (!confirm("Esta galería está programada para publicarse más adelante. ¿Deseas publicarla ahora?")) return;
    const events = demoEvents().map((event) => event.id === button.dataset.publishNow ? { ...event, status: "active", publication_mode: "immediate", publish_at: new Date().toISOString(), publishDate: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() } : event);
    const published = events.find((event) => event.id === button.dataset.publishNow);
    setDemoEvents(events);
    setDemoGalleries(demoGalleries().map((gallery) => gallery.event_id === button.dataset.publishNow ? { ...gallery, status: "active", publish_at: new Date().toISOString() } : gallery));
    createMockNotifications(published, "gallery_published", "publicación anticipada");
    renderAdmin();
  }));
  document.querySelectorAll("[data-reactivate-event]").forEach((button) => button.addEventListener("click", () => reactivateEvent(button.dataset.reactivateEvent)));
  document.querySelectorAll("[data-reactivate-gallery]").forEach((button) => button.addEventListener("click", () => {
    const gallery = demoGalleries().find((item) => item.id === button.dataset.reactivateGallery);
    reactivateEvent(gallery?.event_id);
  }));
  document.querySelectorAll("[data-disable-gallery]").forEach((button) => button.addEventListener("click", () => {
    const gallery = demoGalleries().find((item) => item.id === button.dataset.disableGallery);
    setDemoGalleries(demoGalleries().map((item) => item.id === gallery.id ? { ...item, status: "disabled" } : item));
    setDemoEvents(demoEvents().map((event) => event.id === gallery.event_id ? { ...event, status: "disabled" } : event));
    renderAdmin();
  }));
  document.querySelectorAll("[data-delete-event]").forEach((button) => button.addEventListener("click", () => {
    if (confirm("Eliminar las fotografias de esta galeria? Los pedidos asociados se conservaran.")) {
      setDemoEvents(demoEvents().map((event) => event.id === button.dataset.deleteEvent ? { ...event, status: "deleted", files_available: false, deletionAuditStatus: "eliminacion_con_pedidos_conservados" } : event));
      setDemoGalleries(demoGalleries().map((gallery) => gallery.event_id === button.dataset.deleteEvent ? { ...gallery, status: "deleted", files_available: false } : gallery));
      renderAdmin();
    }
  }));
  document.querySelector("#public-gallery-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setPublicGalleries([...publicGalleries(), {
      id: `public_${Date.now()}`,
      ...data,
      slug: data.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      type: "public",
      status: "active",
      featured: false,
      coverPhotoIndex: 0,
    }]);
    renderAdmin();
  });
  document.querySelectorAll("[data-toggle-public]").forEach((button) => button.addEventListener("click", () => {
    setPublicGalleries(publicGalleries().map((gallery) => gallery.id === button.dataset.togglePublic ? { ...gallery, status: gallery.status === "active" ? "disabled" : "active" } : gallery));
    renderAdmin();
  }));
  document.querySelectorAll("[data-delete-public]").forEach((button) => button.addEventListener("click", () => {
    if (!confirm("Eliminar esta galería pública?")) return;
    setPublicGalleries(publicGalleries().filter((gallery) => gallery.id !== button.dataset.deletePublic));
    renderAdmin();
  }));
  document.querySelectorAll("[data-retry-notification]").forEach((button) => button.addEventListener("click", () => {
    setDemoNotifications(demoNotifications().map((notification) => notification.id === button.dataset.retryNotification ? { ...notification, status: "simulated", attempts: Number(notification.attempts || 0) + 1, error: "", sent_at: new Date().toISOString() } : notification));
    renderAdmin();
  }));
  document.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "Copiado";
    } catch {
      button.textContent = "Copiar manual";
    }
  }));
  const filterSchools = () => {
    const query = document.querySelector("#school-search")?.value.toLowerCase() || "";
    const status = document.querySelector("#school-filter")?.value || "all";
    document.querySelectorAll("[data-school-row]").forEach((row) => {
      const matchesQuery = row.dataset.name.includes(query);
      const matchesStatus = status === "all" || row.dataset.status === status;
      row.style.display = matchesQuery && matchesStatus ? "" : "none";
    });
  };
  document.querySelector("#school-search")?.addEventListener("input", filterSchools);
  document.querySelector("#school-filter")?.addEventListener("change", filterSchools);
  document.querySelector("#simulate-upload")?.addEventListener("click", () => {
    const progress = document.querySelector("#upload-progress");
    let value = 0;
    const timer = setInterval(() => {
      value += 20;
      progress.value = value;
      if (value >= 100) clearInterval(timer);
    }, 150);
  });
  document.querySelectorAll("[data-confirm-photo]").forEach((button) => button.addEventListener("click", () => {
    confirm("Eliminar esta fotografia?");
  }));
}

function metric(label, value) {
  return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`;
}

function adminLabel(item) {
  return {
    dashboard: "Dashboard",
    schools: "Escuelas",
    events: "Eventos",
    galleries: "Galerias",
    public: "Galerías públicas",
    photos: "Fotografias",
    orders: "Pedidos",
    customers: "Clientes",
    notifications: "Notificaciones",
    pricing: "Precios",
    settings: "Configuracion",
  }[item];
}

function generateSchoolCode(name) {
  const base = String(name || "ESCUELA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 10)
    .toUpperCase();
  return `${base || "ESCUELA"}${Math.floor(10 + Math.random() * 89)}`;
}

function schoolRow(school, events) {
  const config = runtimeConfig();
  const schoolEvents = events.filter((event) => (event.school_id || event.schoolId) === school.id);
  return `<tr data-school-row data-status="${school.status}" data-name="${escapeHtml(school.name.toLowerCase())}">
    <td><strong>${escapeHtml(school.name)}</strong><span>${escapeHtml(school.contact_name || "")}</span></td>
    <td>${escapeHtml(school.access_code)}</td>
    <td>${statusLabel(school.status)}</td>
    <td>${schoolEvents.length}</td>
    <td><button class="btn small secondary" data-toggle-school="${school.id}">${school.status === "active" ? "Desactivar" : "Activar"}</button> <button class="btn small secondary" data-regenerate-school="${school.id}">Regenerar código</button> <button class="btn small text" data-copy="${config.brand.plannedDomain}/#/acceso">Copiar acceso</button></td>
  </tr>`;
}

function eventAdminRow(event) {
  const config = runtimeConfig();
  const school = schoolById(event.school_id || event.schoolId);
  const status = effectiveEventStatus(event);
  const scheduled = status === "scheduled";
  const deleted = status === "deleted" || !event.files_available;
  return `<tr>
    <td><strong>${escapeHtml(event.name)}</strong><span>${config.eventTypes[event.event_type] || "Evento escolar"}</span></td>
    <td>${escapeHtml(school?.name || event.schoolName || "")}</td>
    <td>${escapeHtml(event.access_code || event.accessCode)}</td>
    <td>${formatDateTime(event.publish_at)}</td>
    <td>${formatDate(event.expiresAt || event.expires_at?.slice(0, 10))}</td>
    <td><span class="status-pill ${status}">${statusLabel(status)}</span></td>
    <td>${scheduled ? `<span class="countdown" data-countdown="${event.publish_at}">${countdownTo(event.publish_at)}</span>` : "—"}</td>
    <td>
      ${scheduled ? `<button class="btn small secondary" data-publish-now="${event.id}">Publicar ahora</button>` : ""}
      ${status === "expired" || status === "reactivated" ? `<button class="btn small secondary" data-reactivate-event="${event.id}">Reactivar</button>` : ""}
      ${deleted ? `<span class="fineprint">Archivos eliminados</span>` : `<button class="btn small secondary" data-delete-event="${event.id}">Eliminar galería</button>`}
    </td>
  </tr>`;
}

function notificationRow(notification) {
  const config = runtimeConfig();
  const event = eventById(notification.event_id);
  const user = demoUsers().find((item) => item.id === notification.user_id);
  return `<tr>
    <td>${config.notifications.channels[notification.channel] || notification.channel}</td>
    <td>${escapeHtml(user ? `${user.first_name} ${user.last_name}` : "Usuario")}</td>
    <td>${escapeHtml(event?.name || "Evento")}</td>
    <td>${escapeHtml(notification.template)}</td>
    <td>${config.notifications.statuses[notification.status] || notification.status}</td>
    <td>${escapeHtml(notification.reason || "")}</td>
    <td>${notification.attempts || 0}</td>
    <td><button class="btn small secondary" data-retry-notification="${notification.id}">Reintentar</button></td>
  </tr>`;
}

function reactivateEvent(eventId) {
  const event = eventById(eventId);
  const config = runtimeConfig();
  if (!event) return;
  if (!event.files_available || event.status === "deleted") {
    alert("Esta galería ya no puede reactivarse porque sus archivos fueron eliminados.");
    return;
  }
  const label = prompt(`¿Cuánto tiempo debe permanecer activa?\n${config.reactivation.options.map((option) => option.label).join(", ")}`, "7 días");
  if (label === null) return;
  const normalized = normalize(label);
  const option = config.reactivation.options.find((item) => normalize(item.label) === normalized || normalize(item.id) === normalized);
  const hours = option?.hours || (normalized.includes("24") ? 24 : normalized.includes("30") ? 720 : normalized.includes("15") ? 360 : normalized.includes("3") ? 72 : 168);
  const expires = addHours(new Date(), hours);
  const updatedEvent = { ...event, status: "reactivated", reactivated_at: new Date().toISOString(), reactivated_by: "alberto", expires_at: expires.toISOString(), expiresAt: expires.toISOString().slice(0, 10), updated_at: new Date().toISOString() };
  setDemoEvents(demoEvents().map((item) => item.id === event.id ? updatedEvent : item));
  setDemoGalleries(demoGalleries().map((gallery) => gallery.event_id === event.id ? { ...gallery, status: "reactivated", expires_at: updatedEvent.expires_at, expiresAt: updatedEvent.expiresAt } : gallery));
  createMockNotifications(updatedEvent, "gallery_reactivated", "reactivación");
  renderAdmin();
}

function showFormMessage(node, text, type) {
  node.textContent = text;
  node.className = `form-message ${type}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(`${value}T12:00:00`));
}

function renderRoute() {
  state.route = currentClientRoute();
  const [path] = state.route.split("?");
  const parts = path.replace("#/", "").split("/");
  if (path === "#/" || path === "#") renderHome();
  else if (parts[0] === "galerias") renderPublicGalleries();
  else if (parts[0] === "acceso") renderAccess();
  else if (parts[0] === "escuela" && parts[2] === "evento") renderEventWait(parts[1], parts[3]);
  else if (parts[0] === "escuela") renderSchoolLobby(parts[1]);
  else if (parts[0] === "galeria") renderGallery(parts[1]);
  else if (parts[0] === "carrito") renderCart();
  else if (parts[0] === "checkout") renderCheckout();
  else if (parts[0] === "confirmacion") renderConfirmation();
  else if (parts[0] === "login") renderLogin();
  else if (parts[0] === "registro") renderRegister();
  else if (parts[0] === "recuperar") renderRecover();
  else if (parts[0] === "cuenta") renderUserDashboard();
  else if (parts[0] === "admin") renderAdmin();
  else renderHome();
  bindGlobalUi();
}

function bindGlobalUi() {
  document.querySelector("#user-logout")?.addEventListener("click", logoutUser);
  document.querySelectorAll("[data-countdown]").forEach((node) => {
    node.textContent = countdownTo(node.dataset.countdown);
  });
}

window.addEventListener("hashchange", () => {
  state.modalIndex = null;
  renderRoute();
});
window.addEventListener("keydown", (event) => {
  if (state.modalIndex === null) return;
  const photos = filteredPhotos(currentEvent());
  if (event.key === "Escape") closeModal();
  if (event.key === "ArrowLeft") moveModal(photos, -1);
  if (event.key === "ArrowRight") moveModal(photos, 1);
});
setInterval(() => {
  document.querySelectorAll("[data-countdown]").forEach((node) => {
    node.textContent = countdownTo(node.dataset.countdown);
  });
}, 30000);

function showWhatsappPrompt() {
  const widget = document.querySelector("#whatsapp-widget");
  if (!widget) return;
  widget.classList.add("is-visible");
  window.setTimeout(() => {
    document.querySelector("#whatsapp-widget")?.classList.remove("is-visible");
  }, 9000);
}

window.setTimeout(showWhatsappPrompt, 6000);
setInterval(showWhatsappPrompt, 60000);

renderRoute();
