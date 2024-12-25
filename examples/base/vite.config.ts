import { resolve } from 'node:path'

import { defineConfig, searchForWorkspaceRoot } from 'vite'
import dts from 'vite-plugin-dts'

const root = import.meta.dirname
const workspaceRoot = searchForWorkspaceRoot(root)

const reg = /^(lit\/)|(node:)/

export default defineConfig({
  build: {
    lib: {
      entry: { index: resolve(root, 'src/index.ts') },
      formats: ['es']
    },
    rollupOptions: {
      external: (source) => reg.test(source),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src'
      }
    }
  },
  plugins: [
    dts({
      rollupConfig: {
        apiReport: {
          enabled: false,
          reportFolder: resolve(workspaceRoot, 'report'),
          reportTempFolder: resolve(workspaceRoot, '.temp')
        },
        docModel: {
          apiJsonFilePath: resolve(workspaceRoot, '.temp/example-base.api.json'),
          enabled: true,
          projectFolderUrl: 'https://github.com/tsingshaner/tsdoc/blob/main/examples/base'
        }
      },
      rollupOptions: {
        localBuild: true,
        typescriptCompilerFolder: resolve(workspaceRoot, 'node_modules/typescript')
      },
      rollupTypes: true,
      tsconfigPath: resolve(root, 'tsconfig.json')
    })
  ],
  resolve: {
    alias: { '@': resolve(root, 'src') }
  },
  root
})
