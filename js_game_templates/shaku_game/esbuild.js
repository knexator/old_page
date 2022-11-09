#!/usr/bin/env node

const watchFlag = process.argv.indexOf('--watch') > -1
require('esbuild')
  .build({
    entryPoints: ['./src/main.ts'],
    bundle: true,
    outfile: './dist/js/main.js',
    watch: watchFlag,
    format: 'esm', // allows top level await
    // when building, change these 2
    // minify: true,
    sourcemap: true
  })
  .catch(() => process.exit(1))
