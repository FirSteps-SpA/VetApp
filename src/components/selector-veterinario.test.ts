import { describe, expect, it } from "vitest";

import { veterinarioPorDefecto } from "./selector-veterinario";

const vets = [
  { id: "vet-1", nombre: "Ana" },
  { id: "vet-2", nombre: "Bruno" },
];

describe("veterinarioPorDefecto", () => {
  it("el usuario actual si es un veterinario elegible", () => {
    expect(veterinarioPorDefecto(vets, "vet-2")).toBe("vet-2");
  });

  it("vacío si el usuario no está en la lista (p. ej. dev)", () => {
    expect(veterinarioPorDefecto(vets, "dev-1")).toBe("");
  });

  it("vacío sin usuario o sin veterinarios", () => {
    expect(veterinarioPorDefecto(vets, null)).toBe("");
    expect(veterinarioPorDefecto([], "vet-1")).toBe("");
  });
});
