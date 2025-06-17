/**
 * Color harmonics generator for theme system
 * Based on color wheel relationships: dyads, triads, and tetrads
 */

export type HarmonyType = 
  | 'dyad' 
  | 'triad-isosceles' 
  | 'triad-equilateral' 
  | 'tetrad-square' 
  | 'tetrad-rectangle';

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors from harmony
  accent1: string;
  accent2?: string;
  accent3?: string;
  
  // UI colors
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderHover: string;
  
  // Text colors
  text: string;
  textMuted: string;
  textInverse: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Special
  boost: string; // For reblogs
  favorite: string; // For likes
}

export class ColorHarmonics {
  /**
   * Convert HSL to hex color
   */
  static hslToHex(hsl: HSL): string {
    const rgb = this.hslToRgb(hsl);
    return this.rgbToHex(rgb);
  }
  
  /**
   * Convert HSL to RGB
   */
  static hslToRgb(hsl: HSL): RGB {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
  
  /**
   * Convert RGB to hex
   */
  static rgbToHex(rgb: RGB): string {
    return `#${[rgb.r, rgb.g, rgb.b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')}`;
  }
  
  /**
   * Convert hex to HSL
   */
  static hexToHsl(hex: string): HSL {
    // Remove # if present
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
  
  /**
   * Generate harmony colors based on type
   */
  static generateHarmony(seedColor: HSL, type: HarmonyType): HSL[] {
    const colors: HSL[] = [seedColor];
    
    switch (type) {
      case 'dyad':
        // Complementary - 180° apart
        colors.push({
          h: (seedColor.h + 180) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        break;
        
      case 'triad-equilateral':
        // 120° apart
        colors.push({
          h: (seedColor.h + 120) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        colors.push({
          h: (seedColor.h + 240) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        break;
        
      case 'triad-isosceles':
        // Split complementary - base + two colors 30° from complement
        const complement = (seedColor.h + 180) % 360;
        colors.push({
          h: (complement - 30 + 360) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        colors.push({
          h: (complement + 30) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        break;
        
      case 'tetrad-square':
        // 90° apart
        colors.push({
          h: (seedColor.h + 90) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        colors.push({
          h: (seedColor.h + 180) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        colors.push({
          h: (seedColor.h + 270) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        break;
        
      case 'tetrad-rectangle':
        // Two complementary pairs 60° apart
        colors.push({
          h: (seedColor.h + 60) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        colors.push({
          h: (seedColor.h + 180) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        colors.push({
          h: (seedColor.h + 240) % 360,
          s: seedColor.s,
          l: seedColor.l
        });
        break;
    }
    
    return colors;
  }
  
  /**
   * Generate a complete theme from seed color and harmony type
   */
  static generateTheme(
    seedHex: string, 
    harmonyType: HarmonyType, 
    isDark: boolean = false
  ): ThemeColors {
    const seedHsl = this.hexToHsl(seedHex);
    const harmonyColors = this.generateHarmony(seedHsl, harmonyType);
    
    // Adjust lightness for dark theme
    if (isDark) {
      harmonyColors.forEach(color => {
        color.l = Math.max(50, color.l); // Ensure colors are bright enough
      });
    }
    
    const [primary, accent1, accent2, accent3] = harmonyColors;
    
    // Generate UI colors based on theme mode
    const background = isDark 
      ? { h: primary.h, s: 10, l: 8 }
      : { h: primary.h, s: 5, l: 98 };
      
    const surface = isDark
      ? { h: primary.h, s: 8, l: 12 }
      : { h: primary.h, s: 8, l: 96 };
      
    const text = isDark
      ? { h: primary.h, s: 5, l: 90 }
      : { h: primary.h, s: 10, l: 10 };
    
    return {
      // Primary colors
      primary: this.hslToHex(primary),
      primaryLight: this.hslToHex({ ...primary, l: Math.min(primary.l + 10, 90) }),
      primaryDark: this.hslToHex({ ...primary, l: Math.max(primary.l - 10, 20) }),
      
      // Accent colors
      accent1: this.hslToHex(accent1),
      accent2: accent2 ? this.hslToHex(accent2) : undefined,
      accent3: accent3 ? this.hslToHex(accent3) : undefined,
      
      // UI colors
      background: this.hslToHex(background),
      backgroundAlt: this.hslToHex({ ...background, l: isDark ? background.l - 2 : background.l + 2 }),
      surface: this.hslToHex(surface),
      surfaceHover: this.hslToHex({ ...surface, l: isDark ? surface.l + 5 : surface.l - 5 }),
      border: this.hslToHex({ ...surface, l: isDark ? surface.l + 10 : surface.l - 10 }),
      borderHover: this.hslToHex({ ...surface, l: isDark ? surface.l + 15 : surface.l - 15 }),
      
      // Text colors
      text: this.hslToHex(text),
      textMuted: this.hslToHex({ ...text, l: isDark ? text.l - 20 : text.l + 40 }),
      textInverse: this.hslToHex({ ...text, l: isDark ? 10 : 90 }),
      
      // Semantic colors (adjusted from harmony)
      success: this.hslToHex({ h: 140, s: 70, l: isDark ? 50 : 40 }),
      warning: this.hslToHex({ h: 45, s: 90, l: isDark ? 60 : 50 }),
      error: this.hslToHex({ h: 0, s: 70, l: isDark ? 55 : 45 }),
      info: this.hslToHex({ h: 210, s: 70, l: isDark ? 55 : 45 }),
      
      // Special
      boost: accent1 ? this.hslToHex(accent1) : this.hslToHex({ h: 260, s: 60, l: isDark ? 60 : 50 }),
      favorite: accent2 ? this.hslToHex(accent2) : this.hslToHex({ h: 350, s: 70, l: isDark ? 60 : 50 })
    };
  }
  
  /**
   * Generate a random seed color
   */
  static randomSeedColor(): string {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 50 + Math.floor(Math.random() * 30); // 50-80%
    const lightness = 40 + Math.floor(Math.random() * 20); // 40-60%
    
    return this.hslToHex({ h: hue, s: saturation, l: lightness });
  }
}