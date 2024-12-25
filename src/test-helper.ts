import { resolve } from 'node:path'

import type { ApiPackage, ApiVariable } from '@microsoft/api-extractor-model'

import { createApiModel } from './model'

export const model = await createApiModel(resolve('.temp'))

export const basePackage = model.tryGetMemberByKey('@qingshaner/example-base') as ApiPackage
export const baseEntryPoint = basePackage.entryPoints[0]
export const baseItems = {
  variable: baseEntryPoint.tryGetMemberByKey('version|Variable') as ApiVariable
}
