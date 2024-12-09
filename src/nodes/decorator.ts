import type { DocNode, DocNodeConstructor, IDocNodeDefinition } from '@microsoft/tsdoc'

type CustomNode = { definition: IDocNodeDefinition } & typeof DocNode
type CustomNodeDecorator<C extends CustomNode> = (value: C, context: ClassDecoratorContext<C>) => void
/**
 * The `customNode` decorator is used to define a custom DocNode class.
 * @param docNodeKind - A unique string that identifies the custom node kind.
 * @example
 * ```ts
 * @customNode('note_node')
 * class DocNote extends DocNode {
 *   // optional, but recommended
 *   static readonly definition: IDocNodeDefinition
 *   @kindGetter kind!: string
 *
 *   constructor(params: IDocNoteParameters) {
 *     super(params)
 *     // ...
 *   }
 * }
 * ```
 */
export const customNode = <T extends CustomNode>(docNodeKind: string): CustomNodeDecorator<T> => {
  return (value, ctx) => {
    if (ctx.kind !== 'class') {
      throw new Error('The @customNode decorator must be applied to a class')
    }

    const nodeDefinition: IDocNodeDefinition = {
      constructor: value as unknown as DocNodeConstructor,
      docNodeKind
    }

    ctx.addInitializer(function (this: T) {
      Object.defineProperty(value, 'definition', {
        value: nodeDefinition,
        writable: false
      })
    })
  }
}

export const kindGetter = <C extends InstanceType<CustomNode>>(
  _: undefined,
  ctx: ClassFieldDecoratorContext<C, string>
) => {
  if (ctx.kind !== 'field') {
    throw new Error('The @kindGetter decorator must be applied to a field')
  }

  ctx.addInitializer(function () {
    Object.defineProperty(this, ctx.name, {
      get: () => (this.constructor as CustomNode).definition.docNodeKind
    })
  })
}
