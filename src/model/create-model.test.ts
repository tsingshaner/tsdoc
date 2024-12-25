import { ApiModel, ApiPackage } from '@microsoft/api-extractor-model'
import { describe } from 'vitest'

import { basePackage, model } from '@/test-helper'

describe('Read api models data.', (test) => {
  test('Should create a model with api members.', ({ expect }) => {
    expect(model).instanceOf(ApiModel)
    expect(basePackage).instanceOf(ApiPackage)
  })
})
