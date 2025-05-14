import { AsyncComponent, EmptyComponent } from "@biqpod/app/ui/components";
import { useUser } from "@biqpod/app/ui/hooks";
import { Redirect } from "react-router";
import { getCurrentAuth } from "./server";
export const RedirectToLoginIfNeeded = ({ onDone = <EmptyComponent /> }) => {
  const user = useUser();
  return (
    <AsyncComponent
      deps={[user]}
      render={async () => {
        const uid = await getCurrentAuth();
        if (uid) {
          return onDone;
        } else {
          return <Redirect to={"/auth/login"} />;
        }
      }}
    />
  );
};
