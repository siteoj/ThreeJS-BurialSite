import { defineConfig } from 'vite'

const isCodeSandbox = !!process.env.SANDBOX_URL

export default defineConfig({
    root: './src',
    publicDir: '../public/',
    base: './',
    server: {
        host: true,
        open: true
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false
    }
})
