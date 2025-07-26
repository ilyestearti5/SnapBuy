import {
  Button,
  Card,
  CardHeaderForPopup,
  EmptyComponent,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useStoreId } from "../App";
import { snapbuyApi } from "../apis";
import { showPopup, useAsyncMemo } from "@biqpod/app/ui/hooks";
import { UpsertCollection } from "./UpsertCollection";
export const Collections = () => {
  const storeId = useStoreId();
  const collections = useAsyncMemo(async () => {
    if (!storeId) return null;
    return snapbuyApi.getCollections(storeId);
  }, [storeId]);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup title={"Collections"} />
      <Line />
      <Scroll>
        {collections && (
          <EmptyComponent>
            {collections.map((collection) => {
              return (
                <div
                  key={collection.id}
                  className="flex items-center gap-2 hover:bg-[--biqpod-primary-background] p-2 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    showPopup(
                      <UpsertCollection back collection={collection} />
                    );
                  }}
                >
                  <div>
                    <img
                      src={collection.photo}
                      className="border border-[--biqpod-borders] border-solid rounded-xl w-16 h-16 object-cover"
                    />
                  </div>
                  <span>{collection.name}</span>
                </div>
              );
            })}
          </EmptyComponent>
        )}
      </Scroll>
      <Line />
      <div className="p-2">
        <Button
          onClick={() => {
            showPopup(<UpsertCollection back />);
          }}
          className="rounded-full"
        >
          <Translate content="create" />
        </Button>
      </div>
    </Card>
  );
};
