import { useEffect } from "react";
import { getDoc, onCollectionSnapshot } from "./server";
import { useCopyState, useUser } from "biqpod/ui/hooks";
import {
  AsyncComponent,
  Card,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Icon,
  Image,
  Scroll,
} from "biqpod/ui/components";
import { api } from "./apis";
import { allIcons, and, where } from "biqpod/ui/apis";
import { range } from "biqpod/ui/utils";
import { Link } from "react-router-dom";
import { Biqpod } from "biqpod/ui/types";
export const ChangeClient = () => {
  const user = useUser();
  const accessTokens = useCopyState<null | SnapBuy.AccessToken[]>(null);
  useEffect(() => {
    if (user?.uid)
      return onCollectionSnapshot<SnapBuy.AccessToken>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "client-access"],
        (snapshot) => {
          accessTokens.set(
            snapshot.map((access) => ({ ...access.data, id: access.id }))
          );
        },
        {
          where: and(where("usedBy", "==", user.uid)),
        }
      );
  }, []);
  const loading = useCopyState(false);
  return (
    <div className="relative flex flex-col h-full">
      <Scroll>
        {accessTokens.get && (
          <div className="flex flex-col gap-2 p-2">
            {accessTokens.get?.map((access) => (
              <Card
                key={access.id}
                className="relative overflow-hidden cursor-pointer"
              >
                <AsyncComponent
                  render={async () => {
                    const client = await api.getClient(access.clientId);
                    return (
                      <div
                        onClick={async () => {
                          loading.set(true);
                          await api.siginClientByAccessId(access.id);
                          document.getElementById("client-orders")?.click();
                          loading.set(false);
                        }}
                        className="flex justify-between items-center px-3 h-[50px]"
                      >
                        <div className="flex items-center gap-2">
                          <AsyncComponent
                            render={async () => {
                              const user = await getDoc<Biqpod.Account.User>([
                                "users",
                                access.uid!,
                              ]);
                              return (
                                <Image
                                  className="w-[40px] h-[40px]"
                                  src={user?.photo || undefined}
                                  alt={<Icon icon={allIcons.solid.faImage} />}
                                />
                              );
                            }}
                          />
                          <div className="font-bold text-lg">
                            {client?.name}
                          </div>
                        </div>
                        <div>
                          <CircleTip icon={allIcons.solid.faChevronRight} />
                        </div>
                      </div>
                    );
                  }}
                  loading={<CardWait className="w-full h-[50px]" />}
                />
              </Card>
            ))}
            <Link id="client-orders" hidden to={`/client/orders`} />
          </div>
        )}
        {accessTokens.get === null && (
          <div className="flex flex-col gap-2 p-2">
            {range(3).map((index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardWait className="h-[50px]" />
              </Card>
            ))}
          </div>
        )}
      </Scroll>
      {loading.get && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </div>
  );
};
