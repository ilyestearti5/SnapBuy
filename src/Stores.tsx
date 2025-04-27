import { allIcons, and, where } from "biqpod/ui/apis";
import {
  Card,
  CardWait,
  CircleTip,
  Icon,
  Image,
  Scroll,
} from "biqpod/ui/components";
import { useCopyState, useUser } from "biqpod/ui/hooks";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { onCollectionSnapshot } from "./server";
export const Stores = () => {
  const storesList = useCopyState<null | SnapBuy.Store[]>(null);
  const user = useUser();
  useEffect(() => {
    if (user?.uid) {
      return onCollectionSnapshot<SnapBuy.Store>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "stores"],
        (docs) => {
          storesList.set(
            docs.map((doc) => {
              return { ...doc.data, id: doc.id };
            })
          );
        },
        {
          where: and(where("uid", "==", user.uid)),
        }
      );
    }
  }, [user?.uid]);
  return (
    <div className="h-full">
      {storesList.get && (
        <Scroll>
          <div className="flex flex-col gap-2">
            {storesList.get.map(({ id, name, photo }) => {
              return (
                <Card key={id}>
                  <div className="flex justify-between items-center gap-2 p-2">
                    <div className="flex items-center gap-2">
                      <Image
                        className="border-none outline-none"
                        src={photo}
                        alt={
                          <Icon
                            iconClassName="text-5xl"
                            icon={allIcons.solid.faBox}
                          />
                        }
                      />
                      <div>{name}</div>
                    </div>
                    <div>
                      <Link to={"/producer/stores/" + id}>
                        <CircleTip icon={allIcons.solid.faChevronRight} />
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Scroll>
      )}
      {storesList.get === null && <CardWait className="w-full h-full" />}
    </div>
  );
};
