import { Button } from "@repo/components/button";
import { Link } from "react-router";
import { motion } from "motion/react";
import '@repo/common/style.css';

export default function Home() {
  return (
    <div className="container center" style={{height: 50 + 'vh'}}>
      <h1 className="title">Welcome</h1>
      <div className="content-section">
        <p className="subtitle">Sign in to your account or create a new one</p>
      </div>

      <div className="flex gap-4 flex-col w-full">
        <Button variant="accent" size="large" asChild>
          <Link to={"/auth/login"}>Login</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to={"/auth/register"}>Register</Link>
        </Button>
      </div>

      <a href="#" className="help-link">
        Need Help?
      </a>
    </div>
  );
}