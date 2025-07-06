import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Check if HTTPS certificates exist
  const certPath = path.resolve('cert.pem')
  const keyPath = path.resolve('key.pem')
  const hasHTTPS = fs.existsSync(certPath) && fs.existsSync(keyPath)
  
  const serverConfig = {
    port: parseInt(env.VITE_PORT) || 3001,
    proxy: {
      '/api': {
        target: `${hasHTTPS ? 'https' : 'http'}://localhost:${env.PORT || 3008}`,
        secure: false, // Allow self-signed certificates
        changeOrigin: true
      },
      '/ws': {
        target: `${hasHTTPS ? 'wss' : 'ws'}://localhost:${env.PORT || 3008}`,
        ws: true,
        secure: false, // Allow self-signed certificates
        changeOrigin: true
      }
    },
    allowedHosts: ["jarbas.tail925c5f.ts.net"]
  }
  
  // Add HTTPS config if certificates exist
  if (hasHTTPS) {
    serverConfig.https = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    }
  }
  
  return {
    plugins: [react()],
    server: serverConfig,
    build: {
      outDir: 'dist'
    }
  }
})
