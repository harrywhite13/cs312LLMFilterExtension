import { defineConfig } from "vite";
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/content/content.js',
          dest: 'content',
          rename: { stripBase: true }
        },
        {
          src: 'src/modifyfetch.js',
          dest: '.',
          rename: { stripBase: true }
        }
      ]
    })
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: "src/background.js"
      },
      output: {
        entryFileNames: "[name].js",
        format: "es"
      }
    }
  }
});