import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Scroll,
  Line,
  EmptyComponent,
  AsyncComponent,
  CircleLoading,
  Translate,
} from "@biqpod/app/ui/components";
import { delay, tw } from "@biqpod/app/ui/utils";
import { OrderIndex, SnapBuyCollection } from "./Orders/OrderIndex";
import {
  confirm,
  showPopup,
  useCopyState,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../App";
import { UpsertCollection } from "./UpsertCollection";
const forms: {
  id: SnapBuyCollection["type"];
  name: string;
  description: string;
}[] = [
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
  const showedForm = useCopyState<SnapBuyCollection["type"] | null>(null);
  const storeId = useStoreId();
  const selectedCollection = useTemp<SnapBuyCollection | null>(
    "props-collection"
  );
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll>
        <div className="flex flex-col gap-2 p-2">
          {forms.map((form, index) => {
            const selected = showedForm.get === form.id;
            return (
              <Card key={index} className="overflow-hidden cursor-pointer">
                <div className="flex justify-between items-center gap-2 active:bg-[--biqpod-gray-opacity] p-3">
                  <div>
                    <h1 className="font-bold text-xl">
                      <Translate content={form.name} />
                    </h1>
                    <p className="text-[--biqpod-gray-opacity-2]">
                      <Translate content={form.description} />
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div>
                      <CircleTip
                        icon={allIcons.solid.faPlus}
                        onClick={() => {
                          showPopup(
                            <UpsertCollection
                              onChange={async () => {
                                const id = form.id;
                                showedForm.set(null);
                                await delay(1000); // Simulate loading delay
                                showedForm.set(id);
                              }}
                              type={form.id}
                            />
                          );
                        }}
                      />
                    </div>
                    <div>
                      <CircleTip
                        icon={allIcons.solid.faChevronDown}
                        iconClassName={tw(
                          "transition-transform duration-300",
                          selected && "rotate-180"
                        )}
                        onClick={() => {
                          showedForm.set(selected ? null : form.id);
                        }}
                      />
                    </div>
                  </div>
                </div>
                {selected && (
                  <EmptyComponent>
                    <Line />
                    <AsyncComponent
                      deps={[form.id]}
                      render={async () => {
                        await delay(1000); // Simulate loading delay
                        const propsCollections =
                          await snapbuyApi.forms.getCollections(form.id);
                        return (
                          <EmptyComponent>
                            <div className="flex justify-between items-center odd:bg-[--biqpod-primary-background] p-3 font-bold uppercase">
                              <h1>
                                <Translate content="default" />
                              </h1>
                              <div className="flex items-center">
                                <div>
                                  <CircleTip
                                    icon={allIcons.solid.faChevronRight}
                                    onClick={() => {
                                      showedForm.set(null);
                                      selectedCollection.set({
                                        id: form.id + ".default",
                                        name: "Default",
                                        storeId: storeId!,
                                        type: form.id,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            {propsCollections.map((collection) => {
                              return (
                                <div
                                  key={collection.id}
                                  className="flex justify-between items-center odd:bg-[--biqpod-primary-background] p-3 font-bold uppercase"
                                >
                                  <h1>
                                    {collection.name || "Untitled Collection"}
                                  </h1>
                                  <div className="flex items-center">
                                    <div>
                                      <CircleTip
                                        icon={allIcons.solid.faTrash}
                                        onClick={async () => {
                                          const response = await confirm({
                                            title: "Delete Collection",
                                            message:
                                              "Are you sure you want to delete this collection?",
                                            detail:
                                              "This Gona Delete All Data Related To This Collection",
                                          });
                                          if (!response) {
                                            return;
                                          }
                                          await snapbuyApi.forms.deleteCollection(
                                            collection.id!
                                          );
                                          const id = form.id;
                                          showedForm.set(null);
                                          await delay(1000); // Simulate loading delay
                                          showedForm.set(id);
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <CircleTip
                                        icon={allIcons.solid.faChevronRight}
                                        onClick={() => {
                                          showedForm.set(null);
                                          selectedCollection.set(collection);
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </EmptyComponent>
                        );
                      }}
                      loading={
                        <div className="flex justify-center items-center p-4">
                          <CircleLoading />
                        </div>
                      }
                    />
                  </EmptyComponent>
                )}
              </Card>
            );
          })}
        </div>
      </Scroll>
      <div
        className={tw(
          "-right-full flex flex-col absolute overflow-hidden bg-[--biqpod-primary-background] inset-y-0 w-full transition-[right] duration-500",
          selectedCollection.get && "right-0"
        )}
      >
        <div className="flex items-center gap-2 p-2">
          <div>
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                selectedCollection.set(null);
              }}
            />
          </div>
          <h1 className="font-bold text-2xl">
            {selectedCollection?.get?.name}
          </h1>
        </div>
        <Line />
        <OrderIndex />
      </div>
    </div>
  );
};
