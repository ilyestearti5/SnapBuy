import { allIcons } from "biqpod/ui/apis";
import {
  Line,
  Translate,
  Button,
  Field,
  CircleTip,
  BooleanFeild,
  Card,
  EmptyComponent,
  MultiScreenPage,
  CircleLoading,
  Icon,
  PositionView,
} from "biqpod/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  getTemp,
  openMenu,
  setFieldValue,
  setTemp,
  showToast,
  useColorMerge,
  useCopyState,
  useTemp,
  useUser,
} from "biqpod/ui/hooks";
import { range, setFocused, tw } from "biqpod/ui/utils";
import { useEffect } from "react";
import { deleteDoc } from "../server";
import { api } from "../apis";
interface AddProductProps {
  product?: SnapBuy.Product;
}
export const ProdInfo = () => {
  const isAvailable = useTemp<boolean>("is-checked");
  return (
    <EmptyComponent>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label htmlFor="name" className="w-full md:text-right capitalize">
          <Translate content="name" /> :
        </label>
        <div className="w-full">
          <Field
            inputName="prod-name"
            placeholder="Enter Product Name"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label htmlFor="price" className="w-full md:text-right capitalize">
          <Translate content="price" /> :
        </label>
        <div className="w-full">
          <Field
            inputName="prod-price"
            placeholder="Enter Product Price"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label
          htmlFor="prod-category"
          className="w-full md:text-right capitalize"
        >
          <Translate content="category" /> :
        </label>
        <div className="w-full">
          <PositionView positionId="prod-category-layout">
            <Field
              inputName="prod-category"
              placeholder="Enter Product Category"
              className="rounded-xl"
            />
          </PositionView>
        </div>
      </div>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label
          htmlFor="prod-market"
          className="w-full md:text-right capitalize"
        >
          <Translate content="market" /> :
        </label>
        <div className="w-full">
          <PositionView positionId="prod-market-layout">
            <Field
              inputName="prod-market"
              placeholder="Enter Product Market"
              className="rounded-xl"
            />
          </PositionView>
        </div>
      </div>
      <div className="flex justify-between items-center gap-2 p-2">
        <label htmlFor="is-checked" className="w-full text-right capitalize">
          <Translate content="available" /> :
        </label>
        <div className="w-full">
          <BooleanFeild
            id="is-checked"
            config={{
              style: "checkbox",
            }}
            state={isAvailable}
          />
        </div>
      </div>
    </EmptyComponent>
  );
};
export const ProdDesc = () => {
  return (
    <div className="p-2 h-full">
      <Field
        inputName="prod-description"
        className="rounded-2xl w-full h-full"
        placeholder="Enter Product Description 📝"
      />
    </div>
  );
};
export const ProdImage = () => {
  const prodUrls = getTemp<string[]>("prod-photo-urls");
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="relative flex flex-wrap gap-2 p-1 w-full h-full overflow-hidden">
        {prodUrls?.map((url, index) => {
          return (
            <div className="relative rounded-2xl w-[100px] h-[100px] overflow-hidden">
              <img
                src={url}
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="right-1 bottom-1 absolute">
                <CircleTip
                  className="border border-[--biqpod-border-text] border-solid w-[20px] h-[20px]"
                  icon={allIcons.solid.faXmark}
                  iconClassName="text-lg"
                  onClick={() => {
                    const newUrls = [...(prodUrls || [])];
                    newUrls.splice(index, 1);
                    setTemp("prod-photo-urls", newUrls);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Line />
      <div className="flex gap-2 p-2">
        <Button
          icon={allIcons.regular.faPaste}
          className="rounded-full"
          onClick={async () => {
            const text = await navigator.clipboard.readText();
            if (text.startsWith("https://") || text.startsWith("http://")) {
              const exists = prodUrls?.find((url) => url === text);
              if (exists) {
                showToast("Image already exists", "error");
                return;
              }
              const newUrls = [...(prodUrls || [])];
              newUrls.push(text);
              setTemp("prod-photo-urls", newUrls);
            }
          }}
        >
          <Translate content="paste" />
        </Button>
      </div>
    </div>
  );
};

const updateProdForm = (product?: SnapBuy.Product) => {
  setFieldValue("prod-name", product?.name || "");
  setFieldValue("prod-price", product?.price.toString() || "");
  setFieldValue("prod-description", product?.description || "");
  setFieldValue("prod-market", product?.market || "");
  setFieldValue("prod-category", product?.category || "");
  setTemp("is-checked", product?.available || false);
  setTemp("prod-photo-urls", product?.photos || null);
};

export const pages = [<ProdInfo />, <ProdDesc />, <ProdImage />];
export const UpsertProduct = ({ product }: AddProductProps) => {
  const forceId = product?.id;
  const isAvailable = useTemp<null | boolean>("is-checked");
  const focused = useCopyState(1);
  useEffect(() => {
    focused.set(1);
    setFocused("prod-name");
    updateProdForm(product);
  }, []);
  const market = getFieldValue("prod-market");
  const name = getFieldValue("prod-name");
  const price = getFieldValue("prod-price");
  const description = getFieldValue("prod-description");
  const photos = getTemp<string[]>("prod-photo-urls");
  const category = getFieldValue("prod-category");
  const user = useUser();
  const loading = useCopyState(false);
  const colorMerge = useColorMerge();
  return (
    <Card className="relative max-md:rounded-none w-1/2 max-md:w-full max-md:h-full">
      <div className="flex justify-between items-center p-2">
        <h1 className="font-bold text-3xl capitalize">
          <Translate content={forceId ? "modify product" : "add product"} />
        </h1>
        <div className="flex">
          <CircleTip
            icon={allIcons.solid.faEllipsisV}
            onClick={({ clientX, clientY }) => {
              openMenu({
                x: clientX,
                y: clientY,
                menu: [
                  {
                    defaultIcon: allIcons.regular.faCopy,
                    click() {
                      navigator.clipboard.writeText(JSON.stringify(product));
                    },
                    label: "Copy Info",
                  },
                  {
                    label: "Paste",
                    defaultIcon: allIcons.regular.faPaste,
                    click: async () => {
                      const text = await navigator.clipboard.readText();
                      try {
                        const info = JSON.parse(text);
                        updateProdForm(info);
                      } catch {}
                    },
                  },
                ],
              });
            }}
          />
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div className="relative w-full h-full min-h-[50vh] overflow-hidden">
        <MultiScreenPage pages={pages} focused={focused.get - 1} />
      </div>
      <Line />
      <div className="flex justify-center p-2">
        {range(1, pages.length).map((index) => {
          return (
            <span
              key={index}
              className={tw(
                "bg-[--biqpod-gray-opacity] rounded-full w-[20px] h-[20px] cursor-pointer",
                focused.get >= index && "bg-[--biqpod-primary]"
              )}
              onClick={() => {
                focused.set(index);
              }}
            />
          );
        })}
      </div>
      <Line />
      <div className="flex gap-2 p-2">
        {forceId && (
          <Button
            className="rounded-full"
            style={{
              ...colorMerge("error", {
                color: "error.content",
              }),
            }}
            onClick={async () => {
              loading.set(true);
              try {
                await deleteDoc([
                  "projects",
                  import.meta.env.VITE_PROJECT_ID,
                  "products",
                  forceId,
                ]);
                execAction("get-products");
                closePopup();
              } catch {}
              loading.set(false);
            }}
          >
            <Translate content="delete" />
          </Button>
        )}
        <Button
          className="rounded-full"
          onClick={async () => {
            if (!user?.uid) {
              return;
            }
            if (!name) {
              showToast("Please enter a name", "error");
              return;
            }
            if (!price) {
              showToast("Please enter a price", "error");
              return;
            }
            if (!description) {
              showToast("Please enter a description", "error");
              return;
            }
            if (!market) {
              showToast("Please enter a market", "error");
              return;
            }
            if (!category) {
              showToast("Please select a category", "error");
              return;
            }
            if (!photos) {
              showToast("Please select a photo", "error");
              return;
            }
            const option: SnapBuy.Product = {
              id: forceId || crypto.randomUUID(),
              price: parseFloat(price),
              available: isAvailable.get ?? false,
              name,
              description,
              market,
              photos,
              category,
            };
            loading.set(true);
            try {
              await api.upsertProducts([option]);
              execAction("get-products");
              showToast("Product added successfully", "success");
              closePopup();
            } catch {
              showToast("Error while adding product", "error");
            }
            loading.set(false);
          }}
        >
          <Translate content={forceId ? "modify" : "add"} />
        </Button>
      </div>
      {loading.get && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
