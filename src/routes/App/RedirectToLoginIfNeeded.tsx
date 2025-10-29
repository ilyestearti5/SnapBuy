import {
  AsyncComponent,
  BlurOverlay,
  CircleLoading,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import { setTemp, useAsyncEffect, useUser } from "@biqpod/app/ui/hooks";
import { getCurrentAuth } from "../../server";
import { delay } from "@biqpod/app/ui/utils";
import { useHistory } from "react-router-dom";
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
  const hist = useHistory();
  useAsyncEffect(async () => {
    const authUid = await getCurrentAuth();
    if (authUid) {
      setTemp("userLoaded", true);
      return;
    }
    hist.push("/auth/login?redirect=" + location.pathname);
  }, [user, hist]);
  return <EmptyComponent />;
};
