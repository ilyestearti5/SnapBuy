import React from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Field,
  Button,
  Translate,
  CircleLoading,
} from "@biqpod/app/ui/components";
import {
  getFieldValue,
  useAction,
  showToast,
  execAction,
  closePopup,
  setFieldValue,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { SnapBuyCollection } from "./Orders/OrderIndex";
interface UpsertCollectionProps {
  collectionId?: string;
  type?: SnapBuyCollection["type"];
  onChange?: (collection: SnapBuyCollection) => void;
}
export const UpsertCollection = ({
  collectionId,
  type,
  onChange,
}: UpsertCollectionProps) => {
  const collectionName = getFieldValue("form-collection-name");
  const storeId = useStoreId();
  const [loading, setLoading] = React.useState(false);
  useAction(
    "insert-collection",
    async () => {
      if (!type) {
        showToast("Collection type is required", "error");
        return;
      }
      if (!storeId) {
        showToast("Store ID is required", "error");
        return;
      }
      if (!collectionName) {
        showToast("Collection name is required", "error");
        return;
      }
      setLoading(true);
      try {
        const options: SnapBuyCollection = {
          id: collectionId,
          name: collectionName,
          storeId,
          createdAt: Date.now(),
          type,
        };
        await snapbuyApi.forms.upsertCollection(options);
        showToast("Collection added successfully", "success");
        onChange?.(options);
        setFieldValue("form-collection-name", "");
        closePopup();
      } finally {
        setLoading(false);
      }
    },
    [collectionName, storeId]
  );
  if (loading) {
    return (
      <CircleLoading className="flex justify-center items-center min-w-[400px] min-h-[200px]" />
    );
  }
  return (
    <Card className="min-w-[400px]">
      <CardHeaderForPopup
        title={collectionId ? "Edit Collection" : "Add Collection"}
      />
      <Line />
      <div className="flex flex-col gap-2 p-2">
        <Field
          className="rounded-2xl"
          placeholder="Collection Name"
          inputName="form-collection-name"
        />
      </div>
      <Line />
      <div className="p-3">
        <Button
          className="rounded-full"
          icon={allIcons.solid.faPlus}
          onClick={() => {
            execAction("insert-collection");
          }}
        >
          <Translate content="add" />
        </Button>
      </div>
    </Card>
  );
};
