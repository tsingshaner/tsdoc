import { createMain } from 'citty'

import { bin, description, version } from '../../package.json'
import markdown from './markdown'

export const run = createMain({
  meta: {
    description,
    name: Object.keys(bin)[0],
    version
  },
  subCommands() {
    return {
      markdown
    }
    /** @TODO wait jiti is impl import.meta.glob() */
    // const subCommands = import.meta.glob(['./*', '!./index.ts'], { import: 'default' }) as SubCommandsDef
    // return Object.fromEntries(Object.entries(subCommands).map(([cmd, def]) => [cmd.slice(2, -3), def]))
  }
})
