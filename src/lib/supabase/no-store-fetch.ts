// `fetch` sin la Data Cache de Next.js. Next 14 cachea por defecto los `fetch`
// del servidor (incluidos los de supabase-js) aunque la ruta sea dinámica: el
// cliente admin devolvía resultados de hasta un año atrás (cron de recordatorios,
// branding del login). Los datos de Supabase nunca deben cachearse así.
export const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });
