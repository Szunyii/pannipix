// Single source of truth for the canonical site URL (metadata, sitemap,
// robots). Set NEXT_PUBLIC_SITE_URL in the deployment env once the final
// domain is live.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pannipix.vercel.app";
