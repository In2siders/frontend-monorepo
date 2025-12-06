import { Button } from "@repo/components/button";
import { Link } from "react-router";
import '@repo/common/style.css';

export default function Test() {
  return (
    <div className="shadow w-screen h-screen flex flex-col gap-4">
      <h1 className="title">Test page</h1>

      <div className="subtitle">
        <p>Test page</p>
      </div>

      <Button variant="secondary" asChild>
        <Link to={"/chat"}>Chat</Link>
      </Button>

      <form>
        <input type="text" className="input" />
        <input type="text" className="input" />
        <Button variant="secondary" type="submit">Submit</Button>
      </form>
    </div>
  );
}

