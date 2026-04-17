const STAFF_SPRITE_COUNT = 4;
const COURIER_SPRITE_COUNT = 12;
const CUSTOMER_SPRITE_COUNT = 78;

const SPRITE_PATHS = [
  ...Array.from({ length: STAFF_SPRITE_COUNT }, (_, index) => `/assets/sprites/staff-${index}.png`),
  ...Array.from({ length: COURIER_SPRITE_COUNT }, (_, index) => `/assets/sprites/courier-${index}.png`),
  ...Array.from({ length: CUSTOMER_SPRITE_COUNT }, (_, index) => `/assets/sprites/customer-${index}.png`),
];

const preloadCache = new Map<string, Promise<void>>();

function preloadImage(src: string): Promise<void> {
  const cached = preloadCache.get(src);
  if (cached) return cached;

  const image = new Image();
  image.decoding = 'async';
  const loadPromise = new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
  image.src = src;

  const preloadPromise = (
    image.complete
      ? Promise.resolve()
      : image.decode().catch(() => loadPromise)
  ).then(() => undefined);

  preloadCache.set(src, preloadPromise);
  return preloadPromise;
}

export function preloadSimulationSprites() {
  if (typeof window === 'undefined') return;

  SPRITE_PATHS.forEach((spritePath) => {
    void preloadImage(spritePath);
  });
}
