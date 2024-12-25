import { glob } from 'node:fs/promises'
import { join } from 'node:path'

import { type ApiItem, ApiItemContainerMixin, ApiModel } from '@microsoft/api-extractor-model'
import consola from 'consola'

import type { DocComment } from '@microsoft/tsdoc'

import { hasTsdocComment } from './asserts'

const copyInheritedDocs = (targetDocComment: DocComment, sourceDocComment: DocComment) => {
  targetDocComment.summarySection = sourceDocComment.summarySection
  targetDocComment.remarksBlock = sourceDocComment.remarksBlock
  targetDocComment.params.clear()

  for (const param of sourceDocComment.params) {
    targetDocComment.params.add(param)
  }
  for (const typeParam of sourceDocComment.typeParams) {
    targetDocComment.typeParams.add(typeParam)
  }

  targetDocComment.returnsBlock = sourceDocComment.returnsBlock
  targetDocComment.inheritDocTag = undefined
}

/**
 * 将引用的文档覆盖至当前文档。
 * @param apiItem - 当前文档。
 * @param apiModel - ApiModel 根实例。
 */
export const applyInheritDoc = (apiItem: ApiItem, apiModel: ApiModel) => {
  if (hasTsdocComment(apiItem)) {
    const inheritDocTag = apiItem.tsdocComment.inheritDocTag
    if (inheritDocTag?.declarationReference) {
      const result = apiModel.resolveDeclarationReference(inheritDocTag.declarationReference, apiItem)
      if (result.errorMessage) {
        consola.warn(`Unresolved @inheritDoc tag for ${apiItem.displayName}: ${result.errorMessage}`)
      } else if (hasTsdocComment(result.resolvedApiItem) && result.resolvedApiItem !== apiItem) {
        copyInheritedDocs(apiItem.tsdocComment, result.resolvedApiItem.tsdocComment)
      }
    }
  }
  if (ApiItemContainerMixin.isBaseClassOf(apiItem)) {
    for (const member of apiItem.members) {
      applyInheritDoc(member, apiModel)
    }
  }
}

/**
 * 读取 Api 数据文件夹下所有文件, 并返回 ApiModel 实例.
 * @param folder - Api JSON 数据文件文件夹.
 * @public
 */
export const createApiModel = async (folder: string) => {
  const apiModel = new ApiModel()
  for await (const file of glob(join(folder, '**/*.api.json'))) {
    apiModel.loadPackage(file)
  }
  applyInheritDoc(apiModel, apiModel)
  return apiModel
}
