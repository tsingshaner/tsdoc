import { DocSection } from '@microsoft/tsdoc'
import { describe } from 'vitest'

import { baseItems, basePackage, generateCtx, hasText } from '@/test-helper'

import { genTablesPart } from './table-part'

import type { ClassTablePart, EnumTablePart, PackageOrNamespaceTablePart, ParameterTablePart } from './types'

describe('Should generate table parts.', (test) => {
  test('Should generate parameter table.', ({ expect }) => {
    const table = genTablesPart(generateCtx, baseItems.functions.cleanDir)

    expect(table?.part).toBeDefined()

    const { parameter } = table?.part as ParameterTablePart
    expect(parameter.parameters.type.length).toBe(2)
    expect(parameter.parameters.description.every((n) => n instanceof DocSection)).toBeTruthy()
    expect(hasText('path', parameter.parameters.parameter)).toBeTruthy()
    expect(hasText('ignoreErrors', parameter.parameters.parameter)).toBeTruthy()

    expect(hasText('Promise', parameter.returns)).toBeTruthy()
    expect(hasText('<void>', parameter.returns)).toBeTruthy()

    expect(hasText('NodeJS.ErrnoException', parameter.throws)).toBeTruthy()
  })

  test('Should generate enum table.', ({ expect }) => {
    const table = genTablesPart(generateCtx, baseItems.enums.CustomNodeKind)

    expect(table?.part).toBeDefined()

    const { enums } = table?.part as EnumTablePart

    for (const [name, value] of Object.entries({
      DocArticle: 'article',
      DocSource: 'source',
      DocToc: 'toc'
    })) {
      expect(hasText(name, enums.member)).toBeTruthy()
      expect(hasText(value, enums.value)).toBeTruthy()
    }
  })

  test('Should generate class table.', ({ expect }) => {
    const table = genTablesPart(generateCtx, baseItems.classes.DocIcon)

    expect(table?.part).toBeDefined()

    const { class: classPart } = table?.part as ClassTablePart

    expect(classPart.constructors.description.length).toBe(0)
    expect(classPart.events.description.length).toBe(0)
    expect(classPart.methods.description.length).toBe(0)

    expect(classPart.properties.description.length).toBe(1)
    expect(hasText('name', classPart.properties.property)).toBeTruthy()
    expect(hasText('string', classPart.properties.type)).toBeTruthy()
  })

  test('Should generate package table.', ({ expect }) => {
    const table = genTablesPart(generateCtx, basePackage)
    expect(table?.part).toBeDefined()

    const { pkgOrNamespace } = table?.part as PackageOrNamespaceTablePart

    expect(hasText('CustomNodeKind', pkgOrNamespace.enums.enum)).toBeTruthy()
    expect(hasText('WebServer', pkgOrNamespace.classes.class)).toBeTruthy()
    expect(hasText('Entity', pkgOrNamespace.namespaces.namespace)).toBeTruthy()
    expect(hasText('cleanDir', pkgOrNamespace.functions.function)).toBeTruthy()
    expect(hasText('Server', pkgOrNamespace.abstractClasses.abstractClass)).toBeTruthy()
    expect(hasText('DocNode', pkgOrNamespace.interfaces.interface)).toBeTruthy()
    expect(hasText('Release', pkgOrNamespace.typeAliases.typeAlias)).toBeTruthy()
    expect(hasText('RgbColor', pkgOrNamespace.typeAliases.typeAlias)).toBeTruthy()
    expect(hasText('version', pkgOrNamespace.variables.variable)).toBeTruthy()
  })
})
