import { describe } from 'vitest'

import { baseItems } from '@/test-helper'

import { genArticleFrontMatter } from './frontmatter-meta'

describe('', (test) => {
  test('', ({ expect }) => {
    const frontMatter = genArticleFrontMatter(baseItems.variables.version)

    expect(frontMatter).toMatchInlineSnapshot(`
      {
        "breadcrumb": [
          {
            "href": "index",
            "text": "Home",
          },
          {
            "href": "example-base",
            "text": "@qingshaner/example-base",
          },
          {
            "href": "example-base.version",
            "text": "version",
          },
        ],
        "displayName": "version",
        "kind": "Variable",
        "releaseTag": 4,
        "scopedName": "version",
        "source": {
          "fileURLPath": "dist/src/variables.d.ts",
          "repositoryURL": "https://github.com/tsingshaner/tsdoc/blob/main/examples/base/dist/src/variables.d.ts",
        },
      }
    `)
  })
})
