import assert from "node:assert/strict";
import { test } from "node:test";
import { getVehiclePrice, PRICES } from "./vehicles.ts";

const cases: [string, string, number][] = [
  ["BMW", "320", 25],
  ["BMW", "3 Series", 25],
  ["Audi", "A4", 25],
  ["Volkswagen", "Golf", 25],
  ["Škoda", "Octavia", 25],
  ["BMW", "X5", 30],
  ["Škoda", "Kamiq", 30],
  ["Škoda", "Kodiaq", 30],
  ["Opel", "Zafira", 30],
  ["Renault", "Espace", 30],
  ["Volkswagen", "Touran", 30],
  ["Volkswagen", "Caddy", 35],
  ["Citroën", "Berlingo", 35],
  ["Peugeot", "Partner", 35],
  ["Renault", "Kangoo", 35],
  ["Opel", "Combo", 35],
  ["Mercedes-Benz", "Citan", 35],
  ["Mercedes-Benz", "V-Class", 35],
  ["Mercedes-Benz", "Vito", 35],
  ["Volkswagen", "Transporter", 35],
  ["Volkswagen", "Multivan", 35],
  ["Opel", "Vivaro", 35],
  ["Mercedes-Benz", "Sprinter", 35],
  ["Opel", "Zafira Life", 35],
];

for (const [brand, model, expected] of cases) {
  test(`${brand} ${model} → ${expected}€`, () => {
    const r = getVehiclePrice(brand, model);
    assert.equal(r.price, expected);
    assert.equal(r.price, PRICES[r.priceCategory]);
  });
}

test("manual other model", () => {
  const r = getVehiclePrice("Other", "Other", "commercial");
  assert.equal(r.price, 35);
  assert.equal(r.known, false);
});
