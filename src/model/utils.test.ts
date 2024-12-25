import { ApiVariable, ReleaseTag } from '@microsoft/api-extractor-model'
import { describe } from 'vitest'

import { baseItems, model } from '@/test-helper'

import { getReleaseTag, getSourceFileFromApiItem } from '.'
import { getAnchorID } from './utils'

describe('Some api model utilities', (test) => {
  test('Get release tag', ({ expect }) => {
    expect(getReleaseTag(model)).toEqual(ReleaseTag.None)
    expect(getReleaseTag(baseItems.variable)).toEqual(ReleaseTag.Public)
  })

  test('Get api source file url', ({ expect }) => {
    expect(baseItems.variable).instanceOf(ApiVariable)

    const source = getSourceFileFromApiItem(baseItems.variable)
    expect(source).toMatchInlineSnapshot(`
      {
        "fileURLPath": "dist/src/variables.d.ts",
        "repositoryURL": "https://github.com/tsingshaner/tsdoc/blob/main/examples/base/dist/src/variables.d.ts",
      }
    `)
  })

  test('Should get ApiItem id', ({ expect }) => {
    expect(getAnchorID(baseItems.variable)).toMatchInlineSnapshot(`"example-base.version"`)
  })
})
