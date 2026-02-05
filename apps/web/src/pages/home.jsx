import { Button } from "@repo/components/button";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import '@repo/common/style.css';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      <div className="container shadow">
        <h1 className="title">Welcome</h1>

        <div className="subtitle">
          <p>Sign in to your account or create a new one</p>
        </div>


        <div className="flex gap-4 flex-col w-full">
          <Button className="shadow-hover" variant="accent" size="large" asChild>
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
    </motion.div>
  );
}
