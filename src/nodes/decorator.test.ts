import { DocNode, DocSection, type IDocNodeDefinition, TSDocConfiguration } from '@microsoft/tsdoc'
import { describe } from 'vitest'

import { customNode, kind } from './decorator'

describe('custom node decorator', (test) => {
  const docNodeKind = 'CustomNode'

  test('should be able to decorate a node with a static definition', ({ expect }) => {
    @customNode(docNodeKind)
    class CustomNode extends DocNode {
      static readonly definition: IDocNodeDefinition
      get kind() {
        return CustomNode.definition.docNodeKind
      }
    }

    expect(CustomNode.definition.docNodeKind).toBe(docNodeKind)
    expect(CustomNode.definition.constructor).toBe(CustomNode)
    expect(new CustomNode({ configuration: new TSDocConfiguration() }).kind).toBe(docNodeKind)

    expect(() => {
      CustomNode.definition.docNodeKind = 'test'
    }).toThrowErrorMatchingInlineSnapshot(
      `[TypeError: Cannot assign to read only property 'docNodeKind' of object '#<_CustomNode>']`
    )
  })

  test('should define a kind getter', ({ expect }) => {
    @customNode(docNodeKind)
    class CustomNode extends DocSection {
      static readonly definition: IDocNodeDefinition
      // @ts-expect-error kind is a getter
      @kind kind!: string
    }

    expect(new CustomNode({ configuration: new TSDocConfiguration() }).kind).toBe(docNodeKind)

    @customNode(docNodeKind)
    class CustomNode2 extends DocNode {
      static readonly definition: IDocNodeDefinition
      @kind kind!: string
    }

    expect(new CustomNode2({ configuration: new TSDocConfiguration() }).kind).toBe(docNodeKind)
  })
})
