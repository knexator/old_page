Steps I followed to make this:

- create empty dir
- npm i shaku
- npm i -D typescript esbuild
- npx tsc --init
- on tsconfig, set:
  - allowJs: true
  - maxNodeModuleJsDepth: 100
  - include: ["./src/"],
- take esbuild.js from https://iamschulz.com/writing-a-game-in-typescript/
- make src folder, add main.ts
- take index.html from https://github.com/RonenNess/Shaku#html-boilerplate
- do random gamedev

When downloading, run:

- npm install
- http-server
- node ./esbuild.js --watch
