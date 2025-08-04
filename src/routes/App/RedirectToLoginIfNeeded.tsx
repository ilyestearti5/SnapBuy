import {
  AsyncComponent,
  BlurOverlay,
  CircleLoading,
} from "@biqpod/app/ui/components";
import { setTemp, useAsyncEffect, useUser } from "@biqpod/app/ui/hooks";
import { getCurrentAuth } from "../../server";
import { delay } from "@biqpod/app/ui/utils";
import { Link } from "react-router-dom";
export const Redirections = () => {
  return (
    <AsyncComponent
      loading={
        <BlurOverlay className="bg-[--biqpod-primary-background] backdrop-blur-lg">
          <CircleLoading />
        </BlurOverlay>
      }
      render={async () => {
        await delay(1000);
        return <RedirectorChildren />;
      }}
    />
  );
};
export const RedirectorChildren = () => {
  const user = useUser();
  useAsyncEffect(async () => {
    const authUid = await getCurrentAuth();
    if (authUid) {
      setTemp("userLoaded", true);
      return;
    }
    document.getElementById("auth-login")?.click();
  }, [user]);
  return <Link id="auth-login" to="/auth/login" />;
};
