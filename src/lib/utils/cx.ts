// Une clases condicionales sin dependencias. `cx("a", cond && "b", null, "c")`.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
