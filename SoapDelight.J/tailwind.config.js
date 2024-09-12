/** @type {import('tailwindcss').Config} */
const flowbite = require("flowbite-react/tailwind");

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    flowbite.content(),
  ],
  theme: {
    extend: {
      animation: {
        span1: 'span1 3s linear infinite',
        span2: 'span2 3s linear infinite',
        span3: 'span3 3s linear infinite',
        span4: 'span4 3s linear infinite',
        slideUp: 'slideUp 1s ease 0.5s forwards',
      },
      keyframes: {
        span1: {
          '0%': { left: '0%' },
          '100%': { left: '70%' },
        },
        span2: {
          '0%': { right: '0%' },
          '100%': { right: '70%' },
        },
        span3: {
          '0%': { top: '0%' },
          '100%': { top: '70%' },
        },
        span4: {
          '0%': { bottom: '0%' },
          '100%': { bottom: '70%' },
        },
        slideUp: {
          '0%': { top: '23rem' },
          '100%': { top: '17rem' },
        },
      },
    },
    screen:{
      'sm':'600px'
    }
  },
  plugins: [
    flowbite.plugin(),
  ],
}

