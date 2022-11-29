#!/usr/bin/env node

const watchFlag = process.argv.indexOf('--watch') > -1
require('esbuild')
  .build({
    entryPoints: ['./hanoiRot.ts'],
    bundle: true,
    outfile: './hanoiRot.js',
    watch: watchFlag

    // when building, change these 2
    // minify: true,
    // sourcemap: true
  })
  .catch(() => process.exit(1))

require('esbuild')
  .build({
    entryPoints: ['./hanoi.ts'],
    bundle: true,
    outfile: './hanoi.js',
    watch: watchFlag

    // when building, change these 2
    // minify: true,
    // sourcemap: true
  })
  .catch(() => process.exit(1))

require('esbuild')
  .build({
    entryPoints: ['./sokoban.ts'],
    bundle: true,
    outfile: './sokoban.js',
    watch: watchFlag

    // when building, change these 2
    // minify: true,
    // sourcemap: true
  })
  .catch(() => process.exit(1))

require('esbuild')
  .build({
    entryPoints: ['./thue.ts'],
    bundle: true,
    outfile: './thue.js',
    watch: watchFlag

    // when building, change these 2
    // minify: true,
    // sourcemap: true
  })
  .catch(() => process.exit(1))

require('esbuild')
  .build({
    entryPoints: ['./categories_order.ts'],
    bundle: true,
    outfile: './categories_order.js',
    watch: watchFlag

    // when building, change these 2
    // minify: true,
    // sourcemap: true
  })
  .catch(() => process.exit(1))

require('esbuild')
  .build({
    entryPoints: ['./handmade.ts'],
    bundle: true,
    outfile: './handmade.js',
    watch: watchFlag

    // when building, change these 2
    // minify: true,
    // sourcemap: true
  })
  .catch(() => process.exit(1))
