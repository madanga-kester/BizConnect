export type ColorScheme = "light" | "dark";

const lightColors = {
  navy: "#102A43",
  navySoft: "#183B56",
  emerald: "#0B7A61",
  emeraldFill: "#0B7A61",
  emeraldDark: "#06614F",
  emeraldTint: "#E7F4EF",
  orange: "#E9823A",
  orangeTint: "#FFF1E6",
  canvas: "#F7F7F2",
  white: "#FFFFFF",
  surface: "#FFFFFF",
  ink: "#172B3A",
  muted: "#6B7C89",
  border: "#E5E9E6",
  subtle: "#EFF2EF",
  danger: "#B42318",
  dangerTint: "#FDECEB",
  success: "#16734A",
  warning: "#A15C00",
};

const darkColors: typeof lightColors = {
  navy: "#141414",
  navySoft: "#282828",
  emerald: "#53C6A0",
  emeraldFill: "#0C8366",
  emeraldDark: "#66D5AE",
  emeraldTint: "#181818",
  orange: "#F09A57",
  orangeTint: "#241D17",
  canvas: "#000000",
  white: "#FFFFFF",
  surface: "#0A0A0A",
  ink: "#F5F5F5",
  muted: "#A3A3A3",
  border: "#262626",
  subtle: "#141414",
  danger: "#FF8A80",
  dangerTint: "#2A1717",
  success: "#5DDE91",
  warning: "#F2BB64",
};

export function getTabBarColors(scheme: ColorScheme): { backgroundColor: string; borderTopColor: string } {
  const palette = scheme === "dark" ? darkColors : lightColors;
  return {
    backgroundColor: scheme === "dark" ? palette.canvas : palette.surface,
    borderTopColor: palette.border,
  };
}

let activeColorScheme: ColorScheme = "light";
const activePalette = () => activeColorScheme === "dark" ? darkColors : lightColors;

/** Updates app-scoped BizConnect tokens without changing the device appearance. */
export function setBizConnectColorScheme(scheme: ColorScheme): void {
  activeColorScheme = scheme;
}

/**
 * A stable token object whose values follow the active app palette at render time.
 * Module-level inline styles can therefore use `colors.*` without capturing the
 * initial Light values.
 */
export const colors = new Proxy(lightColors, {
  get: (_target, property) => Reflect.get(activePalette(), property),
  has: (_target, property) => Reflect.has(activePalette(), property),
  ownKeys: () => Reflect.ownKeys(lightColors),
  getOwnPropertyDescriptor: (_target, property) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(lightColors, property);
    return descriptor ? { ...descriptor, configurable: true } : undefined;
  },
}) as typeof lightColors;

/**
 * Rebuilds static StyleSheet/inline style maps lazily for each appearance. Use
 * this only for module-level style maps whose values contain `colors.*` tokens.
 */
export function createThemedStyles<T extends object>(factory: () => T): T {
  const cache: Partial<Record<ColorScheme, T>> = {};
  const current = () => {
    const cached = cache[activeColorScheme];
    if (cached) return cached;
    const created = factory();
    cache[activeColorScheme] = created;
    return created;
  };

  return new Proxy({} as T, {
    get: (_target, property) => Reflect.get(current(), property),
    has: (_target, property) => Reflect.has(current(), property),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_target, property) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(current(), property);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30, section: 26 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
export const typography = { title: 28, heading: 21, subheading: 16, body: 14, small: 12, caption: 11 } as const;
