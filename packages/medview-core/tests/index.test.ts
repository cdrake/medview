import { coreFunction, callUIKit } from '../src'
import { describe, it, expect } from 'vitest'

describe('coreFunction', () => {
  it('should return correct message', () => {
    expect(coreFunction()).toBe('Hello from MedView Core!')
  })

  it('should return correct message from uikit', () => {
    expect(callUIKit()).toBe('Hello from UI Kit!')
  })
})
