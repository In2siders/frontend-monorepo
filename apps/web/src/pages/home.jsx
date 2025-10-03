import { Button } from "@repo/components/button";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg">
      <div className="container">
        <div className="login-menu">
          <div className="login-title">
            Title
          </div>
          <Button asChild>
            <Link to={"/auth/login"}>
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link to={"/auth/register"}>
              Register
            </Link>
          </Button>
          <div className="ayuda">
            Help
          </div>
        </div>
      </div>
    </div>
  )
}