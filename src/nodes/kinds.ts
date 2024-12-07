import type { DocNode, DocNodeConstructor, IDocNodeDefinition } from '@microsoft/tsdoc'

const scope = 'qingshaner_'
export const CustomDocNodeKind = {
  /** Title: `## title` */
  heading: `${scope}Heading`
} as const

type CustomNode = { definition: IDocNodeDefinition } & typeof DocNode
type CustomNodeDecorator<C extends CustomNode> = (value: C, context: ClassDecoratorContext<C>) => void
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
