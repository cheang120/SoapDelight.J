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
      },
      keyframes: {
        span1: {
          '0%': { width: '0%' },
          '100%': { width: '30%' },
        },
        span2: {
          '0%': { width: '0%' },
          '100%': { width: '30%' },
        },
        span3:{
          '0%':{top:'0%'},
          '100%':{top:'100%'}
        }
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

