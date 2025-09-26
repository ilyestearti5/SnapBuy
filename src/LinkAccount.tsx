import { getUserFunction } from "@biqpod/app/ui/apis";
import {
  AsyncComponent,
  Card,
  Translate,
  Line,
  Button,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { AnimatedPage } from "./animations";
import { useUser } from "@biqpod/app/ui/hooks";

export const LinkAccount = () => {
  const user = useUser();
  return (
    <AsyncComponent
      render={async () => {
        if (!user) {
          return <EmptyComponent />;
        }
        const code = new URLSearchParams(window.location.search).get("code");
        const name = new URLSearchParams(window.location.search).get("name");
        const fn = await getUserFunction("link-account-data");
        await fn?.({
          code,
          name,
        });
        return (
          <AnimatedPage className="flex justify-center items-center h-full">
            <Card className="overflow-hidden">
              <div className="flex justify-center p-4">
                <img
                  src="https://cdn3d.iconscout.com/3d/premium/thumb/check-3d-icon-png-download-10887804.png"
                  alt="Success"
                  className="w-32 h-32"
                />
              </div>
              <div className="p-3 text-2xl text-center capitalize">
                <Translate content="your account linked success" />
              </div>
              <Line />
              <div className="p-2">
                <Link className="w-full" to="/profile">
                  <Button className="rounded-full">
                    <Translate content="go to profile" />
                  </Button>
                </Link>
              </div>
            </Card>
          </AnimatedPage>
        );
      }}
      error={
        <AnimatedPage className="flex justify-center items-center h-full">
          <Card className="overflow-hidden">
            <div className="flex justify-center p-4">
              <img
                src="https://cdn3d.iconscout.com/3d/premium/thumb/error-3d-icon-png-download-7322798.png"
                alt="Error"
                className="w-32 h-32"
              />
            </div>
            <div className="p-3 text-2xl text-center capitalize">
              <Translate content="failed to link account" />
            </div>
            <Line />
            <div className="p-2">
              <Button
                className="rounded-full"
                onClick={() => window.location.reload()}
              >
                <Translate content="try again" />
              </Button>
            </div>
          </Card>
        </AnimatedPage>
      }
      loading={
        <AnimatedPage className="flex justify-center items-center h-full">
          <Card className="overflow-hidden">
            <div className="p-3 text-2xl text-center capitalize">
              <Translate content="linking account..." />
            </div>
          </Card>
        </AnimatedPage>
      }
      deps={[user]}
    />
  );
};
