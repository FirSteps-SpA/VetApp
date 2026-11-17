"use client";

import { useState, useTransition } from "react";

import { publicarAviso } from "./actions";

export function EditorAviso({ inicial, hayVigente }: { inicial: string; hayVigente: boolean }) {
  const [texto, setTexto] = useState(inicial);
  const [vista, setVista] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  function publicar() {
    const msg = hayVigente
      ? "¿Publicar una versión nueva? Todos los dueños deberán aceptarla de nuevo al entrar al portal."
      : "¿Publicar el aviso de privacidad?";
    if (!window.confirm(msg)) return;
    setError(null);
    setOk(false);
    start(async () => {
      const r = await publicarAviso(texto);
      if (r.error) setError(r.error);
      else setOk(true);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setVista(false)}
          className={`rounded-control px-3 py-1.5 ${!vista ? "bg-accent text-on-accent" : "border border-border text-text"}`}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setVista(true)}
          className={`rounded-control px-3 py-1.5 ${vista ? "bg-accent text-on-accent" : "border border-border text-text"}`}
        >
          Vista previa
        </button>
      </div>
      {vista ? (
        <p className="whitespace-pre-wrap rounded-card border border-border bg-surface p-4 text-sm text-text">
          {texto}
        </p>
      ) : (
        <textarea
          aria-label="Texto del aviso"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setOk(false);
          }}
          rows={24}
          className="w-full rounded-control border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent-subtle"
        />
      )}
      {error && <p className="rounded-control bg-danger-subtle px-3 py-2 text-sm text-text">{error}</p>}
      {ok && <p className="rounded-control bg-accent-subtle px-3 py-2 text-sm text-text">Aviso publicado.</p>}
      <div>
        <button
          type="button"
          onClick={publicar}
          disabled={pending || !texto.trim()}
          className="rounded-control bg-accent px-5 py-2.5 font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Publicando…" : hayVigente ? "Publicar versión nueva" : "Publicar aviso"}
        </button>
      </div>
    </div>
  );
}
