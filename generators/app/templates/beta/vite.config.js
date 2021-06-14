import { defineConfig } from 'vite'
import TsChecker from 'vite-plugin-ts-checker'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [TsChecker()],
})
