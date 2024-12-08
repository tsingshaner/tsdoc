import { glob } from 'node:fs/promises'
import { join } from 'node:path'

import { ApiDocumentedItem, type ApiItem, ApiItemContainerMixin, ApiModel } from '@microsoft/api-extractor-model'
import consola from 'consola'

import type { DocComment } from '@microsoft/tsdoc'

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

const applyInheritDoc = (apiItem: ApiItem, apiModel: ApiModel) => {
  if (apiItem instanceof ApiDocumentedItem && apiItem.tsdocComment) {
    const inheritDocTag = apiItem.tsdocComment.inheritDocTag
    if (inheritDocTag?.declarationReference) {
      const result = apiModel.resolveDeclarationReference(inheritDocTag.declarationReference, apiItem)
      if (result.errorMessage) {
        consola.warn(`Unresolved @inheritDoc tag for ${apiItem.displayName}: ${result.errorMessage}`)
      } else if (
        result.resolvedApiItem instanceof ApiDocumentedItem &&
        result.resolvedApiItem.tsdocComment &&
        result.resolvedApiItem !== apiItem
      ) {
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

export const createApiModel = async (folder: string) => {
  const apiModel = new ApiModel()
  for await (const file of glob(join(folder, '**/*.api.json'))) {
    apiModel.loadPackage(file)
  }
  applyInheritDoc(apiModel, apiModel)
  return apiModel
}
