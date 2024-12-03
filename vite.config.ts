import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

import pkgJSON from './package.json' with { type: 'json' }

const root = import.meta.dirname

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(root, 'src/index.ts'),

        cli: resolve(root, 'src/cli.ts')
      },
      formats: ['es']
    },
    minify: false,
    rollupOptions: {
      external: Object.keys((pkgJSON as { dependencies?: Record<string, string> }).dependencies ?? {})
    }
  },
  plugins: [
    dts({
      exclude: ['test/**'],
      rollupConfig: {
        apiReport: {
          enabled: true,
          reportFolder: resolve(root, 'report'),
          reportTempFolder: resolve(root, '.temp')
        },
        docModel: {
          apiJsonFilePath: resolve(root, '.temp/tsdoc.api.json'),
          enabled: true,
          projectFolderUrl: 'https://beta.qingshaner.com'
        }
      },
      rollupOptions: {
        localBuild: true,
        typescriptCompilerFolder: resolve(root, 'node_modules/typescript')
      },
      rollupTypes: true,
      tsconfigPath: resolve(root, 'config/tsconfig.node.json')
    })
  ],
  resolve: {
    alias: { '@': resolve(root, 'src') }
  },
  root,
  test: {
    coverage: {
      all: true,
      include: ['src/']
    }
  }
})
