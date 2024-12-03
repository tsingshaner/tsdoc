import { createMain, type SubCommandsDef } from 'citty'

import { bin, description, version } from '../../package.json'

export const run = createMain({
  meta: {
    description,
    name: Object.keys(bin)[0],
    version
  },
  subCommands() {
     
    const subCommands = import.meta.glob(['./*', '!./index.ts'], { import: 'default' }) as SubCommandsDef
    return Object.fromEntries(Object.entries(subCommands).map(([cmd, def]) => [cmd.slice(2, -3), def]))
  }
})
