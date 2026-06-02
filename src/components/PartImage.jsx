import { useState } from 'react';
import PropTypes from 'prop-types';
import { resolveImageUrl } from '../lib/imageResolver';

function PartImage({ name, alt = '', loading = 'lazy', ...imgProps }) {
  const [failed, setFailed] = useState(false);

  if (!name || failed) return null;

  const src = resolveImageUrl(name);
  const isWebP = /\.webp$/i.test(src);

  if (isWebP) {
    return (
      <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} {...imgProps} />
    );
  }

  // For non-webp images, try to use a webp version if available
  const webpSrc = src.replace(/\.(png|jpe?g)$/i, '.webp');
  const hasWebpFallback = webpSrc !== src;

  if (hasWebpFallback) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} {...imgProps} />
      </picture>
    );
  }

  return (
    <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} {...imgProps} />
  );
}

PartImage.propTypes = {
  name: PropTypes.string,
  alt: PropTypes.string,
  loading: PropTypes.string,
};

export default PartImage;
