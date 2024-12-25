import {
  ApiAbstractMixin,
  ApiDeclaredItem,
  ApiDocumentedItem,
  ApiInitializerMixin,
  type ApiItem,
  ApiOptionalMixin,
  ApiParameterListMixin,
  ApiPropertyItem,
  ApiProtectedMixin,
  ApiReadonlyMixin,
  ApiReleaseTagMixin,
  ApiStaticMixin
} from '@microsoft/api-extractor-model'

type IsRequired<T, K extends keyof T> = Record<
  K,
  Exclude<T[K], undefined> extends boolean ? true : Exclude<T[K], undefined>
> &
  T

export const hasTsdocComment = (api?: ApiItem): api is IsRequired<ApiDocumentedItem, 'tsdocComment'> =>
  api !== undefined && api instanceof ApiDocumentedItem && api.tsdocComment !== undefined

export const hasReleaseTag = (api: ApiItem): api is ApiReleaseTagMixin => ApiReleaseTagMixin.isBaseClassOf(api)

export const isOptional = (api: ApiItem): api is IsRequired<ApiOptionalMixin, 'isOptional'> =>
  ApiOptionalMixin.isBaseClassOf(api) && api.isOptional

export const isAbstract = (api: ApiItem): api is IsRequired<ApiAbstractMixin, 'isAbstract'> =>
  ApiAbstractMixin.isBaseClassOf(api) && api.isAbstract

export const isInitializer = (api: ApiItem): api is IsRequired<ApiInitializerMixin, 'initializerExcerpt'> =>
  ApiInitializerMixin.isBaseClassOf(api) && api.initializerExcerpt !== undefined

export const isEventProperty = (api: ApiItem): api is IsRequired<ApiPropertyItem, 'isEventProperty'> =>
  api instanceof ApiPropertyItem && api.isEventProperty

export const isParameterList = (api: ApiItem): api is ApiParameterListMixin => ApiParameterListMixin.isBaseClassOf(api)

export const isDeclared = (api: ApiItem): api is ApiDeclaredItem => api instanceof ApiDeclaredItem

export const isProtected = (api: ApiItem): api is IsRequired<ApiProtectedMixin, 'isProtected'> =>
  ApiProtectedMixin.isBaseClassOf(api) && api.isProtected

export const isReadonly = (api: ApiItem): api is IsRequired<ApiReadonlyMixin, 'isReadonly'> =>
  ApiReadonlyMixin.isBaseClassOf(api) && api.isReadonly

export const isStatic = (api: ApiItem): api is IsRequired<ApiStaticMixin, 'isStatic'> =>
  ApiStaticMixin.isBaseClassOf(api) && api.isStatic
