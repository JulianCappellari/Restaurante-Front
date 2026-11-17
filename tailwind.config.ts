import type { Config } from "tailwindcss"
const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const { default: flattenColorPalette } = require("tailwindcss/lib/util/flattenColorPalette");

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-home-display)", "var(--font-sans)", "sans-serif"],
      },
      colors: {
        cliente: {
          blue: '#17336d',
          ink: '#16284e',
          paper: '#f9f8f1',
          butter: '#ffdb71',
          sage: '#e4ebe0',
          mist: '#eaf0fa',
          muted: '#435476',
          line: '#cbd3e0',
        },
        primario: {
          '50': 'rgb(var(--brand-50, 255 242 241) / <alpha-value>)',
          '100': 'rgb(var(--brand-100, 255 228 225) / <alpha-value>)',
          '200': 'rgb(var(--brand-200, 255 204 199) / <alpha-value>)',
          '300': 'rgb(var(--brand-300, 255 168 160) / <alpha-value>)',
          '400': 'rgb(var(--brand-400, 255 111 97) / <alpha-value>)',
          '500': 'rgb(var(--brand-500, 248 76 59) / <alpha-value>)',
          '600': 'rgb(var(--brand-600, 229 47 29) / <alpha-value>)',
          '700': 'rgb(var(--brand-700, 193 35 20) / <alpha-value>)',
          '800': 'rgb(var(--brand-800, 160 32 20) / <alpha-value>)',
          '900': 'rgb(var(--brand-900, 132 34 24) / <alpha-value>)',
          '950': 'rgb(var(--brand-950, 72 13 7) / <alpha-value>)',
        },
    
        secundario: {
        '50': '#f3faf3',
        '100': '#e3f5e3',
        '200': '#c8eac9',
        '300': '#9dd89f',
        '400': '#6fbf73',
        '500': '#46a14b',
        '600': '#358439',
        '700': '#2d6830',
        '800': '#28532a',
        '900': '#224525',
        '950': '#0e2511',
    },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        scroll: "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), addVariablesForColors],
} satisfies Config

export default config;

function addVariablesForColors({ addBase, theme }: any) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}
