import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

// Проверяем, запущен ли отдельный файл (например, `yarn test src/.../file.test.tsx`)
const isTestingSingleFile = process.argv.some((arg) => /.test.tsx?/.test(arg));

const resolveViteConfig = viteConfig as (env: ConfigEnv) => UserConfig;

export default defineConfig((env) =>
  mergeConfig(
    resolveViteConfig(env),
    defineConfig({
      test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: 'tests/setup.tsx',
        css: true,
        root: 'src',
        coverage: {
          reporter: 'text',
          provider: 'v8',
          exclude: ['__mocks__/**/**', '**/index.ts?(x)', '**/types.ts', '**/*.d.ts', 'types', '**/constants/**'],
          all: !isTestingSingleFile, // false при тесте одного файла, true при полном запуске
        },
      },
    }),
  ),
);
