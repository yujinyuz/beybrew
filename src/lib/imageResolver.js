import imageUrls from '../data/image-urls.json';

const { urls, icons } = imageUrls;

/**
 * Resolve an image name to a URL.
 * If the name is already a full URL (starts with http), return it as-is.
 * Otherwise, look it up in the image-urls.json map.
 * Falls back to local /images/ path if not found.
 */
export function resolveImageUrl(name) {
  if (!name) return null;

  // Already a full URL
  if (/^https?:\/\//i.test(name)) {
    return name;
  }

  // Look up in the URL map (exact match)
  if (urls[name]) {
    return urls[name];
  }

  // Try normalized lookup (no hyphens/underscores/spaces, lowercase, no extension)
  // so "BladeScorpioSpear.webp" can match "Blade-Scorpio-Spear.webp"
  const normalized = name
    .replace(/\.(webp|png|jpeg|jpg)$/i, '')
    .replace(/[-_\s]/g, '')
    .toLowerCase();
  if (urls[normalized]) {
    return urls[normalized];
  }

  // Fallback to local path
  return `/images/${name}`;
}

/**
 * Get the icon URL for a beyblade type (attack, defense, balance, stamina).
 */
export function getTypeIconUrl(type) {
  if (!type) return null;
  return icons.type[type] || `/images/${type}.png`;
}

/**
 * Get the icon URL for a spin direction (left, right).
 */
export function getSpinIconUrl(spinType) {
  if (!spinType) return null;
  return icons.spin[spinType] || `/images/${spinType}-spin.png`;
}
