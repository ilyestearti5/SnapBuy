import { ExcelPopup } from "@biqpod/app/ui/components";
import { showPopup } from "@biqpod/app/ui/hooks";
import { getStoreId } from "../utils";
import { PopupProduct } from "./PopupProduct";

export const loadFromExcel = async (file: string | Blob) => {
  let uri: string;
  if (typeof file === "string") {
    uri = file;
  } else {
    // Convert Blob to Object URL
    uri = URL.createObjectURL(file);
  }
  const storeId = getStoreId();
  if (storeId)
    showPopup(
      <ExcelPopup
        uri={uri}
        options={[
          "id",
          "name",
          "description",
          "category",
          "available",
          "limited",
          "themeId",
          "price",
          "quantity",
          "photo",
        ]}
        onChange={(json) => {
          showPopup(
            <PopupProduct
              products={json.map(({ price, photo, ...all }) => {
                return {
                  ...all,
                  single: {
                    price,
                  },
                  type: "single",
                  photos: photo ? [photo] : [],
                  storeId,
                };
              })}
              file={uri}
            />
          );
        }}
        title="Excel File"
      />
    );
};
