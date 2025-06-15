import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Scroll,
  Line,
  TabContent,
} from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
import { ProductIndex } from "./Products/ProductIndex";
import { OrderIndex } from "./Orders/OrderIndex";
import { getTab, setTab } from "@biqpod/app/ui/hooks";
export const forms = [
  {
    id: "product",
    name: "Product",
    description: "Set up a product form to collect product information.",
  },
  {
    id: "order",
    name: "Order",
    description: "Set up an order form to collect order details.",
  },
];

export const Forms = () => {
  const tab = getTab("forms");
  const selectedTab = forms.find((form) => form.id === tab);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll>
        <div className="flex flex-col gap-2 p-2">
          {forms.map((form, index) => {
            return (
              <Card
                key={index}
                className="active:bg-[--biqpod-gray-opacity] cursor-pointer"
                onClick={() => {
                  setTab("forms", form.id);
                }}
              >
                <div className="p-3">
                  <h1 className="font-bold text-xl">{form.name}</h1>
                  <p className="text-[--biqpod-gray-opacity-2]">
                    {form.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </Scroll>
      <div
        className={tw(
          "-right-full flex flex-col absolute bg-[--biqpod-primary-background] inset-y-0 w-full transition-[right] duration-500",
          selectedTab && "right-0"
        )}
      >
        <div className="flex items-center gap-2 p-2">
          <div>
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                setTab("forms", null);
              }}
            />
          </div>
          <h1 className="font-bold text-2xl">{selectedTab?.name || ""}</h1>
        </div>
        <Line />
        <TabContent identifier="forms" value="product">
          <ProductIndex />
        </TabContent>
        <TabContent identifier="forms" value="order">
          <OrderIndex />
        </TabContent>
      </div>
    </div>
  );
};
