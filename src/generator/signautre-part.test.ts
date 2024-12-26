import { DocSection } from '@microsoft/tsdoc'
import { describe } from 'vitest'

import { baseItems, generateCtx } from '@/test-helper'

import { genSignaturePart } from './signature-part'

describe('', (test) => {
  test('', ({ expect }) => {
    const signaturePart = genSignaturePart(generateCtx, baseItems.functions.cleanDir)

    expect(signaturePart).not.toBeNull()
    expect(signaturePart?.signature).instanceOf(DocSection)
  })

  test('', ({ expect }) => {
    const signaturePart = genSignaturePart(generateCtx, baseItems.classes.DocIcon)

    expect(signaturePart).not.toBeNull()
    expect(signaturePart?.signature).instanceOf(DocSection)
    expect(signaturePart?.extends).instanceOf(DocSection)
  })
})
