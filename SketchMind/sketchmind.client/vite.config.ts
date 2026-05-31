import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 60047,
        https: {
            cert: fs.readFileSync('./cert.pem'),
            key: fs.readFileSync('./cert.key'),
        },
        proxy: {
            '/api': {
                target: 'https://localhost:7250',
                secure: false,
                changeOrigin: true
            }
        }
    }
})