import { useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatedCard } from "./animations/components";
import {
  Line,
  Translate,
  Button,
  AsyncComponent,
  BallLoading,
  Card,
} from "@biqpod/app/ui/components";
import { getUserFunction } from "@biqpod/app/ui/apis";
import { LinkAccount } from "./LinkAccount";
import { getCurrentAuth } from "./server";
import { useUser } from "@biqpod/app/ui/hooks";
export const AccountLinking = () => {
  const search = new URLSearchParams(location.search);
  const code = search.get("code");
  const state = search.get("state");
  const linkingAttempted = useRef(false);
  const user = useUser();
  if (!user) {
    return null;
  }
  // If we have OAuth callback parameters, handle the linking process
  if (code && state) {
    return (
      <AsyncComponent
        render={async () => {
          var uid = await getCurrentAuth();
          if (!uid) {
            return (
              <AnimatedCard className="max-w-md overflow-hidden">
                <Card>
                  <div className="flex justify-center p-6">
                    <div className="flex justify-center items-center bg-[--biqpod-danger] rounded-full w-24 h-24">
                      <div className="text-[--biqpod-primary-content] text-5xl">
                        ⚠️
                      </div>
                    </div>
                  </div>
                  <Line />
                  <div className="p-4 text-center">
                    <h2 className="mb-2 font-bold text-[--biqpod-danger] text-2xl">
                      <Translate content="Unauthorized" />
                    </h2>
                    <p className="text-[--biqpod-gray-opacity-2] mb-4">
                      <Translate content="You must be logged in to link your account. Please log in and try again." />
                    </p>
                  </div>
                  <Line />
                  <div className="p-4">
                    <Link className="w-full" to="/auth/login">
                      <Button className="rounded-full w-full text-[--biqpod-primary-content]">
                        <Translate content="Go to Login" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </AnimatedCard>
            );
          }
          // Prevent multiple linking attempts
          if (linkingAttempted.current) {
            return (
              <AnimatedCard className="max-w-md overflow-hidden">
                <Card>
                  <div className="flex justify-center p-6">
                    <div className="flex justify-center items-center bg-[--biqpod-success] rounded-full w-24 h-24">
                      <div className="text-[--biqpod-primary-content] text-5xl">
                        ✓
                      </div>
                    </div>
                  </div>
                  <Line />
                  <div className="p-4 text-center">
                    <h2 className="mb-2 font-bold text-[--biqpod-success] text-2xl">
                      <Translate content="Account Linked Successfully!" />
                    </h2>
                    <p className="text-[--biqpod-gray-opacity-2] mb-4">
                      <Translate content="Your account has been successfully linked. You can now access all features." />
                    </p>
                  </div>
                  <Line />
                  <div className="p-4">
                    <Link className="w-full" to="/developer">
                      <Button className="bg-[--biqpod-success] rounded-full w-full text-[--biqpod-primary-content]">
                        <Translate content="Continue to Developer" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </AnimatedCard>
            );
          }
          linkingAttempted.current = true;
          var linkAccountData = await getUserFunction("link-account-data");
          var jsonState = JSON.parse(state);
          await linkAccountData?.({
            code,
            name: jsonState.name,
          });
          return (
            <AnimatedCard className="max-w-md overflow-hidden">
              <Card>
                <div className="flex justify-center p-6">
                  <div className="flex justify-center items-center bg-[--biqpod-success] rounded-full w-24 h-24">
                    <div className="text-[--biqpod-primary-content] text-5xl">
                      ✓
                    </div>
                  </div>
                </div>
                <Line />
                <div className="p-4 text-center">
                  <h2 className="mb-2 font-bold text-[--biqpod-success] text-2xl">
                    <Translate content="Account Linked Successfully!" />
                  </h2>
                  <p className="text-[--biqpod-gray-opacity-2] mb-4">
                    <Translate content="Your account has been successfully linked. You can now access all features." />
                  </p>
                </div>
                <Line />
                <div className="p-4">
                  <Link className="w-full" to="/developer">
                    <Button className="bg-[--biqpod-success] rounded-full w-full text-[--biqpod-primary-content]">
                      <Translate content="Continue to Developer" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </AnimatedCard>
          );
        }}
        loading={
          <AnimatedCard className="max-w-md overflow-hidden">
            <div className="flex justify-center p-6">
              <BallLoading />
            </div>
            <Line />
            <div className="p-4 text-center">
              <h2 className="mb-2 font-semibold text-[--biqpod-primary] text-xl">
                <Translate content="Linking Account..." />
              </h2>
              <p className="text-[--biqpod-gray-opacity-2]">
                <Translate content="Please wait while we connect your account." />
              </p>
            </div>
          </AnimatedCard>
        }
      />
    );
  }
  // Otherwise, show the LinkAccount component for initial linking
  return <LinkAccount />;
};
