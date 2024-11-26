import { coreFunction, callUIKit } from '@medview/core'

const App = () => {
  return (
    <div>
      <h1>Welcome to MedView Web App</h1>
      <p>{coreFunction()}</p>
      <p>{callUIKit()}</p>
    </div>
  )
}

export default App
