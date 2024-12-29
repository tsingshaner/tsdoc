import type { ApiItem, ApiModel } from '@microsoft/api-extractor-model'
import type { DocSection, TSDocConfiguration } from '@microsoft/tsdoc'

import type { ArticlePart, DocArticle } from '../nodes/custom-nodes/article'

interface GeneratorContext {
  model: ApiModel
  tsdocConfiguration: TSDocConfiguration
}

type HandlerParameters = [ctx: GeneratorContext, api: ApiItem, options: GeneratorOptions]
type ArticleGenerator = (...args: HandlerParameters) => {
  article: DocArticle
  subApis: ApiItem[]
}

interface GeneratorOptions {
  articleInitializer: (...args: HandlerParameters) => DocArticle
  generator: ArticleGenerator
}

export interface GenerateResult<
  T extends ArticlePart = ArticlePart,
  M extends Record<string | symbol, unknown> = Record<string | symbol, unknown>
> {
  meta?: M
  part?: T
  subApis?: ApiItem[]
}

export type { ArticleGenerator, GeneratorContext, GeneratorOptions, HandlerParameters }

export interface RemarksPart extends ArticlePart {
  examples?: DocSection[]
  remarks?: DocSection
  summary: DocSection
}

/** 类型签名片段 */
export interface SignaturePart extends ArticlePart {
  /** 继承的类 */
  extends?: DocSection
  /** 继承的类型 */
  extendTypes?: DocSection
  /** 实现的接口 */
  implements?: DocSection
  /** 类型别名引用 */
  references?: DocSection
  /** 类型声明 */
  signature: DocSection
}

type TableCells<T extends string> = Record<'description' | T, DocSection[]>

interface ClassTablePart extends ArticlePart {
  class: {
    constructors: TableCells<'constructors' | 'modifiers'>
    events: TableCells<'modifiers' | 'property' | 'type'>
    methods: TableCells<'method' | 'modifiers'>
    properties: TableCells<'modifiers' | 'property' | 'type'>
  }
}

interface ParameterTablePart extends ArticlePart {
  parameter: {
    parameters: TableCells<'parameter' | 'type'>
    returns?: DocSection
    throws?: DocSection
  }
}

interface EnumTablePart extends ArticlePart {
  enums: TableCells<'member' | 'value'>
}

interface InterfaceTablePart extends ArticlePart {
  interface: {
    events: TableCells<'modifiers' | 'property' | 'type'>
    methods: TableCells<'method'>
    properties: TableCells<'modifiers' | 'property' | 'type'>
  }
}

interface PackageOrNamespaceTablePart extends ArticlePart {
  pkgOrNamespace: {
    abstractClasses: TableCells<'abstractClass'>
    classes: TableCells<'class'>
    enums: TableCells<'enum'>
    functions: TableCells<'function'>
    interfaces: TableCells<'interface'>
    namespaces: TableCells<'namespace'>
    typeAliases: TableCells<'typeAlias'>
    variables: TableCells<'variable'>
  }
}

interface ModelTablePart extends ArticlePart {
  models: TableCells<'package'>
}

export interface StandardParts extends ArticlePart {
  decorators?: DocSection
  deprecated?: DocSection
  remarks?: RemarksPart
  signature?: SignaturePart
  tables?:
    | ClassTablePart
    | EnumTablePart
    | InterfaceTablePart
    | ModelTablePart
    | PackageOrNamespaceTablePart
    | ParameterTablePart
}

export type {
  ClassTablePart,
  EnumTablePart,
  InterfaceTablePart,
  ModelTablePart,
  PackageOrNamespaceTablePart,
  ParameterTablePart
}
