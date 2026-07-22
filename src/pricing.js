import { appConfig } from "./config.js";

export function getVolumeRule(photoCount, rules = appConfig.pricing.volumeRules) {
  if (photoCount <= 0) return null;
  return rules.find((rule) => photoCount >= rule.min && (rule.max === null || photoCount <= rule.max));
}

export function getNextVolumeRule(photoCount, rules = appConfig.pricing.volumeRules) {
  return rules.find((rule) => photoCount < rule.min) || null;
}

export function calculateCartTotals(items, config = appConfig) {
  const photoCount = items.length;
  const rule = getVolumeRule(photoCount, config.pricing.volumeRules);
  const unitPrice = rule?.unitPrice || 0;
  const baseSubtotal = photoCount * unitPrice;
  const regularSubtotal = photoCount * config.pricing.volumeRules[0].unitPrice;
  const printCopies = items.reduce((sum, item) => {
    if (item.productType !== "print_5x7") return sum;
    return sum + Math.max(1, Number(item.printCopies || 1));
  }, 0);
  const printAddon = printCopies * config.pricing.printAddonPerCopy;
  const total = baseSubtotal + printAddon;
  return {
    photoCount,
    unitPrice,
    rangeLabel: rule ? formatRuleLabel(rule) : "Sin seleccion",
    baseSubtotal,
    regularSubtotal,
    savings: Math.max(0, regularSubtotal - baseSubtotal),
    printCopies,
    printAddon,
    total,
    nextRule: getNextVolumeRule(photoCount, config.pricing.volumeRules),
  };
}

export function formatMoney(value, currency = appConfig.pricing.currency) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRuleLabel(rule) {
  if (!rule) return "";
  if (rule.max === null) return `Desde ${rule.min} fotos`;
  return `${rule.min} a ${rule.max} fotos`;
}

export function volumeMessage(items, config = appConfig) {
  const totals = calculateCartTotals(items, config);
  if (!totals.photoCount) return "Agrega fotografias para calcular tu precio.";
  if (totals.nextRule) {
    const missing = totals.nextRule.min - totals.photoCount;
    const noun = missing === 1 ? "fotografia" : "fotografias";
    return `Agrega ${missing === 1 ? "una" : missing} ${noun} mas para desbloquear el precio de ${formatMoney(totals.nextRule.unitPrice)} por foto.`;
  }
  return "Ya tienes precio especial por volumen.";
}
