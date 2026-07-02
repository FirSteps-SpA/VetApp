import type { MetadataRoute } from "next";

// App clínica privada: no debe indexarse.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
