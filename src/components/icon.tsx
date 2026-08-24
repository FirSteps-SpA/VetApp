import type { CSSProperties } from "react";

// Íconos que heredan el color del texto (currentColor) usando los SVG de
// public/icons/ como máscara CSS. Sirve en componentes server y cliente,
// sin inline-ar los paths pesados y sin recolorear los archivos.
const ICONS = {
  plus: "/icons/plus_white.svg",
  pencil: "/icons/pencil.svg",
  printer: "/icons/printer.svg",
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: IconName;
  className?: string;
}) {
  const url = `url(${ICONS[name]})`;
  const style: CSSProperties = {
    backgroundColor: "currentColor",
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };
  return (
    <span aria-hidden className={`inline-block shrink-0 ${className}`} style={style} />
  );
}
