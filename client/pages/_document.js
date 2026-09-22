import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="theme-color" content="#070b24" />
          <meta name="description" content="Waventra Vetric — premium ecommerce products, secure checkout and order tracking." />
          <meta name="robots" content="index,follow" />
          <meta property="og:site_name" content="Waventra Vetric" />
          <meta property="og:type" content="website" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
