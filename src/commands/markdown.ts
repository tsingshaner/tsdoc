import { defineCommand } from 'citty'
import consola from 'consola'

import { createApiModel } from '../api-model'
import { generateMarkdown } from '../generator/markdown'
import { cleanDir, isDirectory } from '../utils'

export default defineCommand({
  meta: {
    description: 'Generate markdown files',
    name: 'markdown'
  },

  args: {
    input: {
      alias: 'i',
      default: './api',
      description: 'Specifies the input folder containing the *.api.json files to be processed. default: "./api"',
      type: 'string',
      valueHint: 'path'
    },
    output: {
      alias: 'o',
      default: './docs',
      description: 'Specifies the output folder to save markdown files. default: "./docs"',
      type: 'string',
      valueHint: 'path'
    }
  },
  async setup(context) {
    if (!(await isDirectory(context.args.input))) {
      throw new Error(`'${context.args.input}' is not a folder.`)
    }

    await cleanDir(context.args.output)
  },

  async run(ctx) {
    const apiModel = await createApiModel(ctx.args.input)
    generateMarkdown(apiModel)

    consola.info('Generating markdown files', apiModel)
  }
})
