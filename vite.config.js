import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT) || 3001,
      proxy: {
        '/api': `http://localhost:${env.PORT || 3008}`,
        '/ws': {
          target: `ws://localhost:${env.PORT || 3008}`,
          ws: true
        }
      },
      allowedHosts: ["jarbas.tail925c5f.ts.net"]
    },
    build: {
      outDir: 'dist'
    }
  }
})
