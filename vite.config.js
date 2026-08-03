import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The deliverable is one self-contained HTML file, exactly like the original
// Glorya.html: every script and stylesheet is inlined, no external requests.
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2018',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    // keep the shipped file readable-ish in diffs and avoid mangling that could
    // change behaviour; the game is small enough that size is not a concern
    reportCompressedSize: false,
  },
});
