import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GEMINI_API_KEY = typeof import.meta.env.VITE_GEMINI_API_KEY !== 'undefined' 
    ? import.meta.env.VITE_GEMINI_API_KEY 
    : "";

    console.log(GEMINI_API_KEY)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
