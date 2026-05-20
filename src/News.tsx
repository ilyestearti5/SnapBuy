import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "./apis";
import { useParams } from "react-router";
import { EmptyComponent, Line } from "@biqpod/app/ui/components";
import { MarkDown } from "@biqpod/app/ui/shared";
export const News = () => {
  const newId = useParams<{ newsId?: string }>().newsId;
  const newData = useAsyncMemo(async () => {
    if (!newId) {
      return null;
    }
    return snapbuyApi.getNew(newId);
  }, [newId]);
  return (
    <EmptyComponent>
      {newData ? (
        <div>
          <div className="flex justify-center items-center p-5">
            <img
              src={newData.photo}
              alt={newData.title}
              draggable={false}
              className="rounded-xl max-w-full h-[250px] overflow-hidden"
            />
          </div>
          <Line />
          {newData.title && (
            <EmptyComponent>
              <h1 className="p-2 font-bold text-2xl">{newData.title}</h1>
              <Line />
            </EmptyComponent>
          )}
          <div className="p-2">
            <MarkDown value={newData?.content || newData.description} />
          </div>
        </div>
      ) : (
        <p className="p-4">No news found.</p>
      )}
    </EmptyComponent>
  );
};
