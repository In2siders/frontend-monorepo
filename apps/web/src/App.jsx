import { LoginButton, RegisterButton } from "@repo/components/button";
import '@repo/common/style.css'

function App() {
  return (

    <div className="bg">
      <div className="container">
        <div className="login-menu">
          <div className="login-title">
            Title
          </div>
          <RegisterButton />
          <LoginButton />
          <div className="ayuda">
            Help
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
