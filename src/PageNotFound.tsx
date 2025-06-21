import pageNotFound from "./assets/page-not-found.png";
import { Button, Card, Line, Translate } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { Link, useLocation } from "react-router-dom";
export const PageNotFound = () => {
  const pageName = useLocation().pathname;
  return (
    <div className="flex justify-center items-center h-full">
      <Card>
        <div className="flex justify-center items-center p-3">
          <img src={pageNotFound} />
        </div>
        <Line />
        <div className="p-2 text-2xl text-center capitalize">
          <h1>
            <span className="font-bold">{pageName}</span>{" "}
            <Translate content="page not found" />
          </h1>
        </div>
        <Line />
        <div className="p-2">
          <Link to="/profile">
            <Button icon={allIcons.solid.faHome}>
              <Translate content="home" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
