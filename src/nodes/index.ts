import { DocNode, type DocNodeManager, type IDocNodeDefinition, type IDocNodeParameters } from '@microsoft/tsdoc'

import { name } from '../../package.json'
import { CustomDocNodeKind, customNode, kindGetter } from './kinds'

export interface IDocHeadingParameters extends IDocNodeParameters {
  level?: number
  title: string
}

@customNode(CustomDocNodeKind.heading)
class DocHeading extends DocNode {
  static readonly definition: IDocNodeDefinition
  @kindGetter kind!: string

  readonly level: number
  readonly title: string

  constructor(params: IDocHeadingParameters) {
    super(params)

    this.title = params.title
    this.level = params.level ?? 2
  }
}

const registerDocNodes = <T extends Pick<DocNodeManager, 'registerAllowableChildren' | 'registerDocNodes'>>(
  manager: T
) => {
  manager.registerDocNodes(name, [DocHeading.definition])
}

export { DocHeading }
export { CustomDocNodeKind, customNode, registerDocNodes }
