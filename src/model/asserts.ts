import {
  ApiAbstractMixin,
  ApiDocumentedItem,
  ApiInitializerMixin,
  type ApiItem,
  ApiOptionalMixin,
  ApiPropertyItem,
  ApiProtectedMixin,
  ApiReadonlyMixin,
  ApiStaticMixin
} from '@microsoft/api-extractor-model'

type IsRequired<T, K extends keyof T> = Record<
  K,
  Exclude<T[K], undefined> extends boolean ? true : Exclude<T[K], undefined>
> &
  T

export const hasTsdocComment = (apiItem?: ApiItem): apiItem is IsRequired<ApiDocumentedItem, 'tsdocComment'> =>
  apiItem !== undefined && apiItem instanceof ApiDocumentedItem && apiItem.tsdocComment !== undefined

export const isOptional = (apiItem: ApiItem): apiItem is IsRequired<ApiOptionalMixin, 'isOptional'> =>
  ApiOptionalMixin.isBaseClassOf(apiItem) && apiItem.isOptional

export const isAbstract = (apiItem: ApiItem): apiItem is IsRequired<ApiAbstractMixin, 'isAbstract'> =>
  ApiAbstractMixin.isBaseClassOf(apiItem) && apiItem.isAbstract

export const isInitializer = (apiItem: ApiItem): apiItem is IsRequired<ApiInitializerMixin, 'initializerExcerpt'> =>
  ApiInitializerMixin.isBaseClassOf(apiItem) && apiItem.initializerExcerpt !== undefined

export const isEventProperty = (apiItem: ApiItem): apiItem is IsRequired<ApiPropertyItem, 'isEventProperty'> =>
  apiItem instanceof ApiPropertyItem && apiItem.isEventProperty

export const isProtected = (apiItem: ApiItem): apiItem is IsRequired<ApiProtectedMixin, 'isProtected'> =>
  ApiProtectedMixin.isBaseClassOf(apiItem) && apiItem.isProtected

export const isReadonly = (apiItem: ApiItem): apiItem is IsRequired<ApiReadonlyMixin, 'isReadonly'> =>
  ApiReadonlyMixin.isBaseClassOf(apiItem) && apiItem.isReadonly

export const isStatic = (apiItem: ApiItem): apiItem is IsRequired<ApiStaticMixin, 'isStatic'> =>
  ApiStaticMixin.isBaseClassOf(apiItem) && apiItem.isStatic
