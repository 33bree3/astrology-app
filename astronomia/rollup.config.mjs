import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: ['src/index.js', 'src/vsop87.js', 'data/index.js'],
  output: {
    dir: 'lib',
    format: 'cjs',
    sourcemap: true,
  },
  external: ['fs', 'path'], // <-- mark these as external explicitly
  plugins: [
    resolve(),
    commonjs(),
  ],
};
