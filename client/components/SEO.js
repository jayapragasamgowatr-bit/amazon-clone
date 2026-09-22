import Head from "next/head";

export default function SEO({
  title = "Waventra Vetric",
  description = "Waventra Vetric — smart, reliable products with secure checkout and order tracking.",
  path = "",
  noIndex = false,
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const canonical = siteUrl && path ? `${siteUrl}${path}` : siteUrl || undefined;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {canonical && <meta property="og:url" content={canonical} />}
    </Head>
  );
}
