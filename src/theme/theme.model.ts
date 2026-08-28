export const THEME_MODES = Object.freeze(["light", "dark"] as const);

export type ThemeMode = (typeof THEME_MODES)[number];
