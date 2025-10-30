import { Button } from "@repo/components/button";
import { Link } from "react-router";

export default function Home() {
  return (
    <div className="container hoverAnimationY">
      <h1 className="title">Welcome</h1>
      <div className="content-section">
        <p className="subtitle">Sign in to your account or create a new one</p>
      </div>
      
      <div className="button-group">
        <Button className="btn primary-btn w-full hoverAnimationY" asChild>
          <Link to={"/auth/login"}>
            Login
          </Link>
        </Button>
        <Button className="btn secondary-btn w-full hoverAnimationY" asChild>
          <Link to={"/auth/register"}>
            Register
          </Link>
        </Button>
      </div>
      
      <a href="#" className="help-link">Need Help?</a>
    </div>
  )
}