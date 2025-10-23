import { allIcons } from "@biqpod/app/ui/apis";
import {
  EmptyComponent,
  Translate,
  Line,
  JoinComponentBy,
  Icon,
  Button,
} from "@biqpod/app/ui/components";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { getImageByPlatform } from "../utils";
import {
  getOrderClientInfo,
  getOrderClientDisplayName,
  getOrderClientAddress,
} from "../utils/orderClientInfo";

interface ViewClientProps {
  order: Snapbuy.Order;
}
export const ViewClient = ({ order }: ViewClientProps) => {
  const clientInfo = useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);

  if (!clientInfo) {
    return (
      <EmptyComponent>
        <div className="p-4 text-center">
          <Translate content="loading" />
          ...
        </div>
      </EmptyComponent>
    );
  }

  const displayName = getOrderClientDisplayName(clientInfo);
  const address = getOrderClientAddress(clientInfo);
  const addressParts = address
    ? address
        .split(",")
        .map((item) => item.trim())
        .reverse()
    : [];

  return (
    <EmptyComponent>
      <div className="flex items-center p-4">
        <span className="inline-block w-[80px] h-[80px]">
          <img
            className="w-full h-full object-cover"
            src={getImageByPlatform(order.platform)}
          />
        </span>
        <div>
          <h1 className="text-2xl">{displayName}</h1>
          <div className="flex flex-col gap-2">
            <span>
              <Translate content="phone" />: {clientInfo.phone}
            </span>
            {clientInfo.isCustomer && (
              <span className="text-gray-500 text-sm">
                <Translate content="registered customer" />
              </span>
            )}
          </div>
        </div>
      </div>
      <Line />
      {addressParts.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-2 p-4">
            <JoinComponentBy
              list={addressParts.map((add) => {
                return (
                  <span className="bg-[--biqpod-gray-opacity] px-4 py-1 rounded-full">
                    {add}
                  </span>
                );
              })}
              joinComponent={<Icon icon={allIcons.solid.faEllipsisH} />}
            />
          </div>
          <Line />
          <div className="p-4">
            <Button
              onClick={async () => {
                var a = document.createElement("a");
                // open google map for specific address
                a.href = `https://www.google.com/maps/search/?api=1&query=${address}`;
                a.target = "_blank";
                a.click();
              }}
              icon={allIcons.solid.faMapLocationDot}
            >
              <Translate content="open in maps" />
            </Button>
          </div>
        </>
      ) : (
        <div className="p-4 text-gray-500 text-center">
          <Translate content="no address information available" />
        </div>
      )}
    </EmptyComponent>
  );
};
