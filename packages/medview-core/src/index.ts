import { uiFunction } from '@medview/uikit'

export const coreFunction = () => {
    const text = 'Hello from MedView Core!'
    return text
}

export const callUIKit = () => {
    return uiFunction()
}
