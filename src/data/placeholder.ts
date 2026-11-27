/**
 * Local placeholder images (inline SVG), so the page loads no third-party
 * image host. Replaced by gmp archive images in phase 3.
 */
export function placeholder(
  width: number,
  height: number,
  bg: string,
  fg: string,
  label = '',
): string {
  const text = label
    ? `<text x="50%" y="50%" fill="#${fg}" font-family="Georgia, serif" font-size="${Math.round(width / 16)}" text-anchor="middle" dominant-baseline="middle">${label}</text>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#${bg}"/>${text}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
