import { md } from 'mdbox'

import type { DocSection } from '@microsoft/tsdoc'

import { FrontMatterMeta, StandardPart } from '../generator/constants'
import {
  convertCustomDocNodeToMdx,
  convertCustomNodeToMdxText,
  convertFrontmatter,
  convertTablePartToMdx,
  genArticleTitle,
  MarkdownWriter
} from './transforms'

import type { FrontMatter } from '../generator/handlers'
import type {
  ClassTablePart,
  EnumTablePart,
  InterfaceTablePart,
  ModelTablePart,
  PackageOrNamespaceTablePart,
  ParameterTablePart,
  StandardParts
} from '../generator/types'
import type { DocArticle } from '../nodes/custom-nodes/article'

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export const transformToMdx = (article: DocArticle): string => {
  const writer = new MarkdownWriter({ endOfLine: 'lf' })
  const frontmatter: FrontMatter = article.meta[FrontMatterMeta] as FrontMatter

  writer.write(convertFrontmatter(frontmatter))
  writer.write(md.heading(genArticleTitle(frontmatter), 2))

  const parts = article.getPart<StandardParts>(StandardPart)

  if (parts?.remarks) {
    convertCustomDocNodeToMdx(parts.remarks.summary, writer)
  }

  if (parts?.deprecated) {
    writer.write('<div class="note danger">')
    convertCustomDocNodeToMdx(parts.deprecated, writer)
    writer.write('</div>')
    writer.writerEmptyLine()
  }

  if (parts?.signature) {
    writer.write(md.heading('类型声明', 2))
    if (parts.signature.signature) {
      convertCustomDocNodeToMdx(parts.signature.signature, writer)
    }
    if (parts.decorators) {
      writer.write(md.heading('装饰器', 3))
      convertCustomDocNodeToMdx(parts.decorators, writer)
    }
    if (parts.signature.extendTypes) {
      writer.write(md.heading('Extend Types', 3))
      convertCustomDocNodeToMdx(parts.signature.extendTypes, writer)
    }
    if (parts.signature.extends) {
      writer.write(md.heading('Extends', 3))
      convertCustomDocNodeToMdx(parts.signature.extends, writer)
    }
    if (parts.signature.implements) {
      writer.write(md.heading('Implements', 3))
      convertCustomDocNodeToMdx(parts.signature.implements, writer)
    }
    if (parts.signature.references) {
      writer.write(md.heading('Type References', 3))
      convertCustomDocNodeToMdx(parts.signature.references, writer)
    }
  }

  if (parts?.tables) {
    if (Reflect.has(parts.tables, 'parameter')) {
      const table = (parts.tables as ParameterTablePart).parameter
      if (table.parameters) {
        convertTablePartToMdx(writer, table.parameters, [
          ['parameter', '参数'],
          ['type', '类型'],
          ['description', '描述']
        ])
      }
      if (table.returns) {
        writer.write(md.heading('Returns', 2))
        convertCustomDocNodeToMdx(table.returns, writer)
      }
      if (table.throws) {
        writer.write(md.heading('Throws', 2))
        convertCustomDocNodeToMdx(table.throws, writer)
      }
    }

    if (Reflect.has(parts.tables, 'class')) {
      md.heading('Classes', 2)
      const table = (parts.tables as ClassTablePart).class
      if (table.constructors) {
        writer.write(md.heading('Constructors', 3))
        convertTablePartToMdx(writer, table.constructors, [
          ['constructors', '构造函数'],
          ['modifiers', '修饰符'],
          ['description', '描述']
        ])
        writer.newLine()
      }

      if (table.properties) {
        writer.write(md.heading('Properties', 3))
        convertTablePartToMdx(writer, table.properties, [
          ['modifiers', '修饰符'],
          ['property', '属性'],
          ['type', '类型'],
          ['description', '描述']
        ])
        writer.newLine()
      }

      if (table.methods) {
        writer.write(md.heading('Methods', 3))
        convertTablePartToMdx(writer, table.methods, [
          ['method', '方法'],
          ['modifiers', '修饰符'],
          ['description', '描述']
        ])
        writer.newLine()
      }

      if (table.events) {
        writer.write(md.heading('Events', 3))
        convertTablePartToMdx(writer, table.events, [
          ['modifiers', '修饰符'],
          ['property', '属性'],
          ['type', '类型'],
          ['description', '描述']
        ])
        writer.newLine()
      }
    }

    if (Reflect.has(parts.tables, 'enums')) {
      writer.write(md.heading('Enums', 2))
      const table = (parts.tables as EnumTablePart).enums
      convertTablePartToMdx(writer, table, [
        ['member', '成员'],
        ['value', '值'],
        ['description', '描述']
      ])
    }

    if (Reflect.has(parts.tables, 'interface')) {
      writer.write(md.heading('Interfaces', 2))
      const table = (parts.tables as InterfaceTablePart).interface
      if (table.properties) {
        writer.write(md.heading('Properties', 3))
        convertTablePartToMdx(writer, table.properties, [
          ['modifiers', '修饰符'],
          ['property', '属性'],
          ['type', '类型'],
          ['description', '描述']
        ])
        writer.newLine()
      }

      if (table.methods) {
        writer.write(md.heading('Methods', 3))
        convertTablePartToMdx(writer, table.methods, [
          ['method', '方法'],
          ['description', '描述']
        ])
        writer.newLine()
      }

      if (table.events) {
        writer.write(md.heading('Events', 3))
        convertTablePartToMdx(writer, table.events, [
          ['modifiers', '修饰符'],
          ['property', '属性'],
          ['type', '类型'],
          ['description', '描述']
        ])
        writer.newLine()
      }
    }

    if (parts.tables.models) {
      const table = (parts.tables as ModelTablePart).models
      writer.write(md.heading('Models', 2))
      convertTablePartToMdx(writer, table, [
        ['package', '包'],
        ['description', '描述']
      ])
    }

    if (parts.tables.pkgOrNamespace) {
      const table = (parts.tables as PackageOrNamespaceTablePart).pkgOrNamespace
      if (table.abstractClasses) {
        writer.write(md.heading('Abstract Classes', 2))
        convertTablePartToMdx(writer, table.abstractClasses, [
          ['abstractClass', '抽象类'],
          ['description', '描述']
        ])
      }
      if (table.classes) {
        writer.write(md.heading('Classes', 2))
        convertTablePartToMdx(writer, table.classes, [
          ['class', '类'],
          ['description', '描述']
        ])
      }
      if (table.enums) {
        writer.write(md.heading('Enums', 2))
        convertTablePartToMdx(writer, table.enums, [
          ['enum', '枚举'],
          ['description', '描述']
        ])
      }
      if (table.functions) {
        writer.write(md.heading('Functions', 2))
        convertTablePartToMdx(writer, table.functions, [
          ['function', '函数'],
          ['description', '描述']
        ])
      }
      if (table.interfaces) {
        writer.write(md.heading('Interfaces', 2))
        convertTablePartToMdx(writer, table.interfaces, [
          ['interface', '接口'],
          ['description', '描述']
        ])
      }
      if (table.namespaces) {
        writer.write(md.heading('Namespaces', 2))
        convertTablePartToMdx(writer, table.namespaces, [
          ['namespace', '命名空间'],
          ['description', '描述']
        ])
      }
      if (table.typeAliases) {
        writer.write(md.heading('Type Aliases', 2))
        convertTablePartToMdx(writer, table.typeAliases, [
          ['typeAlias', '类型别名'],
          ['description', '描述']
        ])
      }
      if (table.variables) {
        writer.write(md.heading('Variables', 2))
        convertTablePartToMdx(writer, table.variables, [
          ['variable', '变量'],
          ['description', '描述']
        ])
      }
    }
  }

  if (parts?.remarks?.remarks) {
    writer.write(md.heading('使用说明', 2))
    convertCustomDocNodeToMdx(parts.remarks.remarks, writer)
  }

  if (parts?.remarks?.examples) {
    if (parts.remarks.examples.length === 1) {
      writer.write(md.heading('示例', 2))
      convertCustomDocNodeToMdx(parts.remarks.examples[0], writer)
    } else {
      for (let i = 0; i < parts.remarks.examples.length; i++) {
        writer.write(md.heading(`示例 ${i + 1}`, 2))
        convertCustomDocNodeToMdx(parts.remarks.examples[i], writer)
      }
    }
  }

  writer.newLine()
  return writer.toString()
}
