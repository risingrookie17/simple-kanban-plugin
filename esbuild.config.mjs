import esbuild from 'esbuild';

const isDev = process.argv.includes('--dev');

const ctx = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  target: 'node18',
  outfile: 'main.js',
  sourcemap: isDev,
  minify: !isDev,
});

if (isDev) {
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('Build complete!');
}
