import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a0c2e', // Deep purple
        primary: '#ff00ff', // Neon magenta
        secondary: '#00ffff', // Neon cyan
        accent: '#ffff00', // Neon yellow
        text: '#ffffff',
      },
      fontFamily: {
        retro: ['"Press Start 2P"', 'cursive'],
      },
      boxShadow: {
        'neon-primary': '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff',
        'neon-secondary': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff',
      },
    },
  },
  plugins: [],
};
export default config;