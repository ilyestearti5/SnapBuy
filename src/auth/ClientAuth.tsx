import {
  AsyncComponent,
  Button,
  Card,
  CircleLoading,
  EmptyComponent,
  Line,
  Translate,
} from "biqpod/ui/components";
import { api } from "../apis";
import img from "../../public/warning-error.svg";
import { Redirect } from "react-router";
import { showToast, useUser } from "biqpod/ui/hooks";
export const ClientAuth = () => {
  const user = useUser();
  return (
    <div className="flex justify-center items-center h-full">
      <AsyncComponent
        deps={[user]}
        render={async () => {
          if (!user) return <EmptyComponent />;
          const code = new URL(location.href).searchParams.get("code");
          if (!code) {
            return (
              <Card className="w-2/3">
                <div className="flex justify-center p-3">
                  <img src={img} className="w-[200px]" />
                </div>
                <Line />
                <div className="p-2 text-2xl text-center capitalize">
                  <Translate content="code not gived" />
                </div>
              </Card>
            );
          }
          if (code) {
            await api.siginClient(code);
          }
          const client = await api.getCurrentClient();
          if (!client) {
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
          showToast(`Sigin To ${client.client.name}`, "success");
          return <Redirect to="/client/orders" />;
        }}
        loading={
          <div className="flex justify-center items-center h-full">
            <CircleLoading />
          </div>
        }
      />
    </div>
  );
};
