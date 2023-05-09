#!/usr/bin/env node

const watchFlag = process.argv.indexOf('--watch') > -1
require('esbuild')
  .build({
    entryPoints: ['./main.ts'],
    bundle: true,
    outfile: './main.js',
    watch: watchFlag,
    platform: 'node'

    // when building, change these 2
    // minify: true,
    // sourcemap: true
  })
  .catch(() => process.exit(1))
