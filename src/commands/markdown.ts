import consola from 'consola'

import type { CommandDef } from 'citty'

export default {
  meta: {
    description: 'Generate markdown files',
    name: 'markdown'
  },
  run() {
    consola.info('Generating markdown files')
  }
} satisfies CommandDef
