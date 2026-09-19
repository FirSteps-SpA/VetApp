// Mini gráfico de evolución (peso, temperatura) a partir del historial de
// consultas de un paciente. Sin librería de charts: son pocos puntos (un
// paciente típico tiene < 20 consultas), un SVG a mano alcanza.

const WIDTH = 100;
const HEIGHT = 32;
const PAD_Y = 3;

export interface PuntoSerie {
  fecha: string;
  valor: number;
}

export function Sparkline({
  puntos,
  label,
  unidad,
  tono = "accent",
}: {
  puntos: PuntoSerie[];
  label: string;
  unidad: string;
  tono?: "accent" | "accent-secondary";
}) {
  if (puntos.length === 0) {
    return (
      <div>
        <p className="text-support text-text-muted">{label}</p>
        <p className="mt-1 text-support text-text-muted">Sin registros.</p>
      </div>
    );
  }

  const valores = puntos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;

  const coords = puntos.map((p, i) => {
    const x = puntos.length === 1 ? WIDTH / 2 : (i / (puntos.length - 1)) * WIDTH;
    const y = HEIGHT - PAD_Y - ((p.valor - min) / rango) * (HEIGHT - PAD_Y * 2);
    return { x, y };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${HEIGHT} L${coords[0].x.toFixed(1)},${HEIGHT} Z`;

  const ultimo = puntos[puntos.length - 1];
  const strokeClass = tono === "accent" ? "stroke-accent" : "stroke-accent-secondary";
  const fillClass =
    tono === "accent" ? "fill-accent-subtle" : "fill-accent-secondary-subtle";
  const dotClass = tono === "accent" ? "fill-accent" : "fill-accent-secondary";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-support text-text-muted">{label}</p>
        <p className="tabular-nums text-support font-medium text-text">
          {ultimo.valor}
          {unidad}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-1 h-10 w-full"
        role="img"
        aria-label={`${label}: de ${min}${unidad} a ${max}${unidad}, último valor ${ultimo.valor}${unidad}`}
      >
        <path d={areaPath} className={fillClass} stroke="none" />
        <path
          d={linePath}
          className={strokeClass}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r="1.8"
          className={dotClass}
        />
      </svg>
      <div className="flex justify-between text-[0.625rem] text-text-muted">
        <span>{min}{unidad}</span>
        <span>{max}{unidad}</span>
      </div>
    </div>
  );
}
