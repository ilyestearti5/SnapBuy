import {
  AsyncComponent,
  Card,
  Line,
  Translate,
  Button,
} from "biqpod/ui/components";
import { showToast } from "biqpod/ui/hooks";
import { Redirect } from "react-router";
import { api } from "../apis";
import img from "../../public/warning-error.svg";
export const AccountAuth = () => {
  return (
    <AsyncComponent
      render={async () => {
        const code = new URL(location.search).searchParams.get("code");
        if (!code) {
          return (
            <Card className="w-2/3">
              <div className="flex justify-center p-3">
                <img src={img} className="w-[200px]" />
              </div>
              <Line />
              <div className="text-2xl capitalize">
                <Translate content="code not gived" />
              </div>
            </Card>
          );
        }
        if (code) {
          await api.siginAccount(code);
        }
        const account = await api.getCurrentAccount();
        if (!account) {
          return (
            <Card className="w-2/3">
              <div className="flex justify-center p-3">
                <img src={img} className="w-[200px]" />
              </div>
              <Line />
              <div className="text-2xl capitalize">
                <Translate content="found problems in sigin" />
              </div>
              <Line />
              <div className="p-3">
                <Button
                  className="rounded-full"
                  onClick={() => {
                    location.reload();
                  }}
                >
                  <Translate content="try again" />
                </Button>
              </div>
            </Card>
          );
        }
        showToast(`Sigin To ${account.name}`, "success");
        return <Redirect to="/account" />;
      }}
    />
  );
};
