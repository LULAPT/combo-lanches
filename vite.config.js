import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind v4 entra como plugin do Vite — não existe mais tailwind.config.js
// nem postcss.config.js. Toda a configuração de tema vive no @theme do
// src/index.css, que é o mais perto possível do :root que você já escreve.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // `@/components/X` em vez de `../../components/X`. O CLI do ReactBits
      // instala nesse alias por padrão, e o jsconfig.json espelha isso pro
      // VS Code conseguir seguir o import com ctrl+clique.
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
