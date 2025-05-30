import { allIcons } from "@biqpod/app/ui/apis";
import {
  EmptyComponent,
  Translate,
  Line,
  JoinComponentBy,
  Icon,
  Button,
} from "@biqpod/app/ui/components";
import { getImageByPlatform } from "../utils";

interface ViewClientProps {
  order: SnapBuy.Order;
}
export const ViewClient = ({ order }: ViewClientProps) => {
  var address = order.client?.place.address
    .split(",")
    .map((item) => item.trim())
    .reverse();
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
          <h1 className="text-2xl">
            {order.client?.firstname} {order.client?.lastname}
          </h1>
          <div className="flex flex-col gap-2">
            <span>
              <Translate content="phone" />: {order.client?.phone}
            </span>
          </div>
        </div>
      </div>
      <Line />
      <div className="flex flex-wrap items-center gap-2 p-4">
        <JoinComponentBy
          list={address.map((add) => {
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
            var address = order.client?.place.address;
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
    </EmptyComponent>
  );
};
