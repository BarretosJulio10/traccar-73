// Turbo Colormap
export const turboPolynomials = {
  r: [0.13572138, 4.6153926, -42.66032258, 132.13108234, -152.94239396, 59.28637943],
  g: [0.09140261, 2.19418839, 4.84296658, -14.18503333, 4.27729857, 2.82956604],
  b: [0.1066733, 12.64194608, -60.58204836, 110.36276771, -89.90310912, 27.34824973],
};

const interpolateChannel = (normalizedValue, coeffs) => {
  let result = 0;
  for (let i = 0; i < coeffs.length; i += 1) {
    result += coeffs[i] * normalizedValue ** i;
  }
  return Math.max(0, Math.min(1, result));
};

export const interpolateTurbo = (value) => {
  const normalizedValue = Math.max(0, Math.min(1, value));
  return [
    Math.round(255 * interpolateChannel(normalizedValue, turboPolynomials.r)),
    Math.round(255 * interpolateChannel(normalizedValue, turboPolynomials.g)),
    Math.round(255 * interpolateChannel(normalizedValue, turboPolynomials.b)),
  ];
};

const getSpeedColor = (speed, minSpeed, maxSpeed) => {
  const normalizedSpeed = (speed - minSpeed) / (maxSpeed - minSpeed);

  const [r, g, b] = interpolateTurbo(normalizedSpeed);

  return `rgb(${r}, ${g}, ${b})`;
};

export const hexToRgb = (hex) => {
  if (!hex) return null;
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

/**
 * Returns the best contrast color (Black or White) for a given background,
 * unless a manual override color is provided.
 */
export const getContrastColor = (backgroundHex, manualColor) => {
  if (manualColor) return manualColor;
  if (!backgroundHex) return '#0f172a'; // Default dark color if no background

  const rgb = hexToRgb(backgroundHex);
  if (!rgb) return '#0f172a';

  // YIQ formula for contrast detection
  const yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  return yiq >= 128 ? '#0f172a' : '#ffffff';
};

export default getSpeedColor;
