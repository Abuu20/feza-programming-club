import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Feza Programming Club';
const DEFAULT_IMAGE = '/og-image.jpg';

/**
 * Drop this at the top of any page to set a distinct title/description
 * (and social preview) for that page. Without it, every page shares the
 * generic tags in public/index.html, which hurts SEO since search engines
 * see no unique content signal per page.
 */
const SEO = ({ title, description, image = DEFAULT_IMAGE, path = '' }) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = `https://fezaprogramming.com${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
