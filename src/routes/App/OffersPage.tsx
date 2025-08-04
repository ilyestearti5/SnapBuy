import {
  Card,
  CircleLoading,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../../apis";
export const OffersPage = () => {
  const actions = useAsyncMemo(async () => {
    return snapbuyApi.getAIActions();
  }, []);
  return (
    <Scroll>
      <div className="flex flex-col gap-2 p-2">
        <Card>
          <div className="p-3">
            <h1 className="font-bold text-2xl capitalize">
              <Translate content="ai actions" />
            </h1>
          </div>
          <Line />
          <div>
            {actions === null && (
              <div className="flex justify-center items-center p-2">
                <div>
                  <CircleLoading />
                </div>
              </div>
            )}
            {actions?.map(({ name, description }) => (
              <div
                key={name}
                className="odd:bg-[--biqpod-primary-background] p-2"
              >
                <h2 className="font-semibold text-[--biqpod-primary] text-xl capitalize">
                  {name.replaceAll(/_+/gi, " ")}
                </h2>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Scroll>
  );
};
