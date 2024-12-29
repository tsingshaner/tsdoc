import { resolve } from 'node:path'

import {
  DocCodeSpan,
  DocEscapedText,
  DocFencedCode,
  DocLinkTag,
  DocNode,
  DocPlainText,
  TSDocConfiguration
} from '@microsoft/tsdoc'

import type {
  ApiClass,
  ApiFunction,
  ApiInterface,
  ApiPackage,
  ApiTypeAlias,
  ApiVariable
} from '@microsoft/api-extractor-model'

import { createApiModel } from './model'
import { registerDocNodes } from './nodes'

import type { GeneratorContext } from './generator/types'

export const model = await createApiModel(resolve('.temp'))

export const basePackage = model.tryGetMemberByKey('@qingshaner/example-base') as ApiPackage
export const baseEntryPoint = basePackage.entryPoints[0]
export const baseItems = {
  classes: {
    DocIcon: baseEntryPoint.tryGetMemberByKey('DocIcon|Class') as ApiClass,
    Server: baseEntryPoint.tryGetMemberByKey('Server|Class') as ApiClass,
    WebServer: baseEntryPoint.tryGetMemberByKey('WebServer|Class') as ApiClass
  },
  enums: {
    CustomNodeKind: baseEntryPoint.tryGetMemberByKey('CustomNodeKind|Enum') as ApiInterface,
    ReleaseTag: baseEntryPoint.tryGetMemberByKey('ReleaseTag|Enum') as ApiInterface
  },
  functions: {
    cleanDir: baseEntryPoint.tryGetMemberByKey('cleanDir|Function|1') as ApiFunction,
    isDirectory: baseEntryPoint.tryGetMemberByKey('isDirectory|Function|1') as ApiFunction
  },
  interfaces: {
    DocNode: baseEntryPoint.tryGetMemberByKey('DocNode|Interface') as ApiInterface,
    DocReleaseTag: baseEntryPoint.tryGetMemberByKey('DocReleaseTag|Interface') as ApiInterface,
    DocTag: baseEntryPoint.tryGetMemberByKey('DocTag|Interface') as ApiInterface,
    IServer: baseEntryPoint.tryGetMemberByKey('IServer|Interface') as ApiInterface
  },
  typeAliases: {
    DocArticle: baseEntryPoint.tryGetMemberByKey('DocArticle|TypeAlias') as ApiTypeAlias,
    Release: baseEntryPoint.tryGetMemberByKey('Release|TypeAlias') as ApiTypeAlias,
    RgbColor: baseEntryPoint.tryGetMemberByKey('RgbColor|TypeAlias') as ApiTypeAlias
  },
  variables: {
    version: baseEntryPoint.tryGetMemberByKey('version|Variable') as ApiVariable
  }
}

const tsDocConfig = new TSDocConfiguration()
registerDocNodes(tsDocConfig.docNodeManager)
export const generateCtx: GeneratorContext = {
  model,
  tsdocConfiguration: tsDocConfig
}

export const hasText = (text: string, nodes: DocNode | DocNode[] | readonly DocNode[] = []): boolean => {
  const nodesArr = Array.isArray(nodes) ? nodes : [nodes]

  return nodesArr.some((c) => {
    switch (true) {
      case c instanceof DocLinkTag:
        return c.linkText?.includes(text) ?? c.urlDestination?.includes(text)
      case c instanceof DocPlainText:
        return c.text.includes(text)
      case c instanceof DocCodeSpan:
        return c.code.includes(text)
      case c instanceof DocEscapedText:
        return c.decodedText.includes(text)
      case c instanceof DocFencedCode:
        return c.code.includes(text)
      case c instanceof DocNode:
        return hasText(text, c.getChildNodes())
      default:
        return false
    }
  })
}
