import assert from "node:assert/strict";
import { calculateCartTotals, volumeMessage } from "../src/pricing.js";

const digital = (count) =>
  Array.from({ length: count }, (_, index) => ({
    photoId: `p-${index}`,
    productType: "digital",
    printCopies: 1,
  }));

const printed = (count, copies = 1) =>
  Array.from({ length: count }, (_, index) => ({
    photoId: `p-${index}`,
    productType: "print_5x7",
    printCopies: copies,
  }));

assert.equal(calculateCartTotals(digital(1)).total, 45, "1 fotografia = $45");
assert.equal(calculateCartTotals(digital(5)).total, 225, "5 fotografias = $225");
assert.equal(calculateCartTotals(digital(6)).total, 240, "6 fotografias = $240");
assert.equal(calculateCartTotals(digital(10)).total, 400, "10 fotografias = $400");
assert.equal(calculateCartTotals(digital(11)).total, 385, "11 fotografias = $385");
assert.equal(calculateCartTotals(digital(6)).unitPrice, 40, "Al pasar de 5 a 6 todas quedan a $40");
assert.equal(calculateCartTotals(digital(11)).unitPrice, 35, "Al pasar de 10 a 11 todas quedan a $35");
assert.equal(calculateCartTotals(digital(10)).unitPrice, 40, "Al bajar de 11 a 10 regresan a $40");
assert.equal(calculateCartTotals(digital(5)).unitPrice, 45, "Al bajar de 6 a 5 regresan a $45");
assert.equal(calculateCartTotals(printed(1)).total, 50, "Una impresion suma $5");
assert.equal(calculateCartTotals(printed(1, 3)).total, 60, "Tres copias impresas suman $15");
assert.equal(calculateCartTotals(printed(6)).total, 270, "6 impresas: 6 x $40 + 6 x $5");
assert.match(volumeMessage(digital(5)), /\$40/, "Mensaje de siguiente rango");
assert.match(volumeMessage(digital(11)), /precio especial/, "Mensaje de precio especial");

console.log("Pricing regression tests passed.");
