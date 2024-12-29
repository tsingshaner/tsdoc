import { DocSection } from '@microsoft/tsdoc'
import { describe } from 'vitest'

import { baseItems, generateCtx, hasText } from '@/test-helper'

import { genRemarkPart } from './remark-part'

describe('Should generate remark parts.', (test) => {
  test('Should generate summary part.', ({ expect }) => {
    const remarkPart = genRemarkPart(generateCtx, baseItems.variables.version)

    expect(remarkPart).not.toBeNull()
    expect(remarkPart?.summary).instanceOf(DocSection)
  })

  test('Should generate examples.', ({ expect }) => {
    const remarkPart = genRemarkPart(generateCtx, baseItems.functions.isDirectory)

    expect(remarkPart?.examples).instanceOf(Array)
    expect(remarkPart?.examples?.length).toBe(2)
    remarkPart?.examples?.every((i) => expect(i).instanceOf(DocSection))
  })

  test('Should generate remarks.', ({ expect }) => {
    const remarkPart = genRemarkPart(generateCtx, baseItems.classes.DocIcon)

    expect(remarkPart?.summary).instanceOf(DocSection)
    expect(remarkPart?.remarks).instanceOf(DocSection)
  })

  test('Should include inherit doc.', ({ expect }) => {
    const remarkPart = genRemarkPart(generateCtx, baseItems.classes.Server)

    expect(remarkPart?.summary).instanceOf(DocSection)
    expect(remarkPart?.remarks).instanceOf(DocSection)

    expect(hasText('A server interface.', remarkPart?.summary.getChildNodes())).toBeTruthy()
    expect(hasText('This interface defines the basic methods for a server.', remarkPart?.remarks?.nodes)).toBeTruthy()
  })
})
