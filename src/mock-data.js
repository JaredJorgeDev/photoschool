import { appConfig } from "./config.js";

const nowIso = "2026-07-21T09:00:00-06:00";

export const mockDb = {
  users: [],
  admins: [
    {
      id: "admin_alberto",
      username: appConfig.access.adminUsername,
      role: "owner",
      name: "Alberto de la Fuente",
    },
  ],
  schools: [
    {
      id: "school_antares",
      name: "Colegio Antares",
      slug: "colegio-antares",
      accessCode: "ANTARES",
      status: "active",
      logo: null,
      coverImage: null,
      contactName: "",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "school_pedro_de_gante",
      name: "Pedro de Gante",
      slug: "pedro-de-gante",
      accessCode: "PEDROGANTE",
      status: "active",
      logo: null,
      coverImage: null,
      contactName: "",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ],
  events: [],
  galleries: [],
  public_galleries: [
    {
      id: "public_graduaciones",
      title: "Graduaciones",
      slug: "graduaciones",
      category: "Graduaciones",
      description: "Cobertura editorial de ceremonias, entregas y retratos de generación.",
      status: "active",
      type: "public",
      featured: true,
      publish_at: "2026-07-01T08:00:00-06:00",
      cta: "WhatsApp",
      coverPhotoIndex: 2,
    },
    {
      id: "public_festivales",
      title: "Festivales escolares",
      slug: "festivales-escolares",
      category: "Festivales escolares",
      description: "Momentos representativos de eventos culturales y celebraciones escolares.",
      status: "active",
      type: "public",
      featured: true,
      publish_at: "2026-07-01T08:00:00-06:00",
      cta: "WhatsApp",
      coverPhotoIndex: 5,
    },
    {
      id: "public_credenciales",
      title: "Credencialización y anuarios",
      slug: "credencializacion-anuarios",
      category: "Credencialización",
      description: "Muestra visual de servicios complementarios para escuelas.",
      status: "scheduled",
      type: "public",
      featured: false,
      publish_at: "2026-08-01T08:00:00-06:00",
      cta: "WhatsApp",
      coverPhotoIndex: 7,
    },
  ],
  photos: [],
  photo_variants: [],
  access_codes: [],
  user_gallery_access: [],
  notification_subscriptions: [],
  notifications: [],
  customers: [],
  carts: [],
  cart_items: [],
  orders: [],
  order_items: [],
  payments: [],
  downloads: [],
  print_jobs: [],
  pricing_rules: appConfig.pricing.volumeRules,
  audit_logs: [
    {
      id: "audit_policy_1",
      event: "gallery_expiration_policy",
      detail:
        "Al vencer, las fotos se eliminaran o archivaran; pedidos y pagos se conservaran.",
    },
    {
      id: "audit_policy_2",
      event: "backend_required",
      detail:
        "En producción, permisos, cron, expiración, pagos y enlaces firmados se validarán en backend.",
    },
  ],
};

const categories = ["Ceremonia", "Individuales", "Familia", "Generacion", "Convivencia"];
const titles = [
  "Escenario principal",
  "Retrato escolar",
  "Foto familiar",
  "Grupo generacional",
  "Convivencia",
  "Entrega de diplomas",
  "Sonrisa individual",
  "Abrazo familiar",
  "Linea de generacion",
  "Patio escolar",
  "Aplausos",
  "Retrato formal",
  "Familia completa",
  "Generacion 2026",
  "Amistades",
  "Diploma",
  "Pose individual",
  "Cierre de evento",
];

mockDb.portfolio_photos = Array.from({ length: 18 }, (_, index) => {
  const number = String(index + 1).padStart(4, "0");
  const category = categories[index % categories.length];
  return {
    id: `portfolio_photo_${number}`,
    eventId: "portfolio",
    event_id: "portfolio",
    galleryId: "portfolio",
    gallery_id: "portfolio",
    identifier: `PT-${number}`,
    title: titles[index],
    category,
    published: true,
    watermarkStatus: "aplicada",
    variants: {
      thumbnail: "generated-portfolio-svg",
      protectedView: "generated-portfolio-svg",
      originalPrivate: null,
    },
    metadata: {
      sequence: index + 1,
      publicPortfolio: true,
    },
  };
});
