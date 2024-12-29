import { DocSection } from '@microsoft/tsdoc'
import { describe } from 'vitest'

import { baseItems, generateCtx, hasText } from '@/test-helper'

import { genSignaturePart } from './signature-part'

describe('Should extract api type signature.', (test) => {
  test('Should extract type signature section', ({ expect }) => {
    const signaturePart = genSignaturePart(generateCtx, baseItems.functions.cleanDir)

    expect(signaturePart).not.toBeNull()
    expect(signaturePart?.signature).instanceOf(DocSection)
  })

  test('Should extract extends type.', ({ expect }) => {
    const signaturePart = genSignaturePart(generateCtx, baseItems.classes.DocIcon)

    expect(signaturePart).not.toBeNull()
    expect(signaturePart?.signature).instanceOf(DocSection)
    expect(hasText('declare class DocIcon extends LitElement ', signaturePart?.signature)).toBeTruthy()

    expect(signaturePart?.extends).instanceOf(DocSection)
    expect(hasText('LitElement', signaturePart?.extends)).toBeTruthy()
  })
})
