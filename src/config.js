export const appConfig = {
  brand: {
    parent: "Photos Time",
    product: "PhotoSchool",
    client: "Alberto de la Fuente",
    plannedDomain: "photoschool.com.mx",
  },
  contact: {
    whatsappDisplay: "775 160 4463",
    whatsappInternational: "527751604463",
    whatsappMessage: "Hola, quiero información sobre PhotoSchool y los servicios de fotografía escolar.",
  },
  access: {
    type: "escuela_y_evento",
    adminUsername: "alberto",
    adminPassword: "photostime2026",
  },
  timezone: "America/Mexico_City",
  settingsOptions: {
    timezones: [
      { id: "America/Mexico_City", label: "Ciudad de México" },
      { id: "America/Cancun", label: "Cancún" },
      { id: "America/Tijuana", label: "Tijuana" },
    ],
    galleryValidityMonths: [
      { id: 1, label: "1 mes" },
      { id: 2, label: "2 meses" },
    ],
    downloadAvailabilityDays: [
      { id: 3, label: "3 días" },
      { id: 7, label: "7 días" },
      { id: 14, label: "14 días" },
    ],
    paymentMethods: [
      { id: "mercado_pago", label: "Mercado Pago", statusAfterConfirm: "Pago aprobado" },
      { id: "transferencia", label: "Transferencia bancaria", statusAfterConfirm: "Pago pendiente" },
    ],
    printDeliveryTypes: [
      {
        id: "recoleccion_personal",
        label: "Recolección personal",
        note: "Alberto se pondra en contacto contigo para coordinar la entrega.",
      },
    ],
  },
  roles: {
    admin: "admin",
    staff: "staff",
    customer: "customer",
    guest: "guest",
  },
  schoolStatuses: {
    active: "Activa",
    inactive: "Inactiva",
  },
  galleryTypes: {
    public: "Pública",
    private: "Privada",
  },
  eventTypes: {
    spring: "Festival de primavera",
    mothers_day: "Día de las Madres",
    end_of_year: "Fin de cursos",
    graduation: "Graduación",
    sports: "Evento deportivo",
    cultural: "Evento cultural",
    other: "Otro evento",
  },
  galleryStates: {
    draft: "Borrador",
    scheduled: "Programada",
    active: "Activa",
    expiring_soon: "Próxima a vencer",
    expired: "Vencida",
    reactivated: "Reactivada",
    disabled: "Desactivada",
    deleting: "Eliminando",
    deleted: "Eliminada",
  },
  reactivation: {
    options: [
      { id: "24h", label: "24 horas", hours: 24 },
      { id: "3d", label: "3 días", hours: 72 },
      { id: "7d", label: "7 días", hours: 168 },
      { id: "15d", label: "15 días", hours: 360 },
      { id: "30d", label: "30 días", hours: 720 },
      { id: "custom", label: "Fecha y hora personalizada", hours: null },
    ],
  },
  notifications: {
    channels: {
      email: "Correo electrónico",
      whatsapp: "WhatsApp",
    },
    statuses: {
      pending: "Pendiente",
      simulated: "Registrada",
      sent: "Enviada",
      failed: "Fallida",
    },
    types: {
      gallery_published: "Galería publicada",
      gallery_expiring: "Galería próxima a vencer",
      download_expiring: "Descarga próxima a expirar",
      print_ready: "Impresión lista para recoger",
      order_confirmed: "Pedido confirmado",
      gallery_reactivated: "Reactivación de galería",
    },
  },
  pricing: {
    currency: "MXN",
    volumeRules: [
      { min: 1, max: 5, unitPrice: 45 },
      { min: 6, max: 10, unitPrice: 40 },
      { min: 11, max: null, unitPrice: 35 },
    ],
    printAddonPerCopy: 5,
  },
  lifecycle: {
    galleryValidityMonths: 2,
    downloadAvailabilityDays: 7,
  },
  delivery: {
    printDeliveryType: "recoleccion_personal",
    printDeliveryLabel: "Recolección personal",
    printDeliveryNote: "Alberto se pondra en contacto contigo para coordinar la entrega.",
  },
  payments: {
    primary: "mercado_pago",
    alternative: "transferencia",
    methods: [
      {
        id: "mercado_pago",
        label: "Mercado Pago",
        kind: "configurado",
        statusAfterConfirm: "Pago aprobado",
      },
      {
        id: "transferencia",
        label: "Transferencia bancaria",
        kind: "configurado",
        statusAfterConfirm: "Pago pendiente",
      },
    ],
  },
  routes: {
    home: "#/",
    access: "#/acceso",
    publicGalleries: "#/galerias",
    login: "#/login",
    account: "#/cuenta",
    gallery: "#/galeria/festival-fin-cursos-2026",
    cart: "#/carrito",
    checkout: "#/checkout",
    confirmation: "#/confirmacion",
    admin: "#/admin",
  },
};
