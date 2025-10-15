import { allIcons } from "@biqpod/app/ui/apis";
import {
  Line,
  Button,
  Translate,
  EmptyComponent,
  Icon,
} from "@biqpod/app/ui/components";

export interface SouqifyCollection {
  id?: string;
  name?: string;
  storeId?: string;
  createdAt?: number;
  updatedAt?: number;
  uid?: string;
  type?: "product" | "order"; // Type of collection, can be product or order
}
export const OrderIndex = () => {
  return (
    <EmptyComponent>
      <div className="flex flex-col justify-center items-center gap-2 text-[--biqpod-gray-opacity-2] w-full h-full">
        <Icon
          icon={allIcons.solid.faCircleExclamation}
          iconClassName="text-4xl max-md:text-3xl"
        />
        <p className="max-md:text-base text-lg text-center">
          <Translate content="order properties feature has been removed" />
        </p>
      </div>
      <Line />
      <div className="flex justify-between p-4">
        <div className="max-md:hidden"></div>
        <Button
          className="opacity-50 rounded-full w-fit max-md:w-full cursor-not-allowed"
          icon={allIcons.solid.faPlus}
          disabled
        >
          <Translate content="add property" />
        </Button>
      </div>
    </EmptyComponent>
  );
};
