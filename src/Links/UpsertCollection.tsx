import {
  Button,
  Card,
  CardWait,
  CircleTip,
  Field,
  Icon,
  ImageField,
  Line,
  Scroll,
  TabContent,
  Translate,
} from "@biqpod/app/ui/components";
import { useStoreId } from "../App";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  isLoading,
  setFieldValue,
  setTab,
  showPopup,
  showToast,
  useAction,
  useAsyncEffect,
  useAsyncMemo,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { delay, filterFuzzySearch, mapAsync, tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { allIcons, getDownloadURL, updateFile } from "@biqpod/app/ui/apis";
import { getPrice } from "../utils";
import { Nothing } from "@biqpod/app/ui/types";
import { Collections } from "./Collections";
interface ProductRenderProps {
  product: SnapBuy.Product;
  selectedProducts: SnapBuy.Product[];
  onChangeSelectedProducts?: (products: SnapBuy.Product[]) => void;
}
export const ProductRender = ({
  product,
  selectedProducts,
  onChangeSelectedProducts,
}: ProductRenderProps) => {
  const photo = product.photos?.at(0);
  const isSelected = selectedProducts?.includes(product);
  const price = getPrice(product);
  return (
    <div
      className={tw(
        "w-[calc(50%)] flex items-center px-4 justify-between py-2 cursor-pointer",
        "hover:bg-[--biqpod-gray-opacity]"
      )}
      key={product.id}
      onClick={async () => {
        if (isSelected) {
          const response = await confirm({
            title: "Remove Product",
            message: `Are you sure you want to remove ${product.name} from the collection?`,
            detail: "This action cannot be undone.",
          });
          if (!response) return;
          onChangeSelectedProducts?.(
            selectedProducts.filter((p) => p.id !== product.id)
          );
        } else {
          onChangeSelectedProducts?.([...selectedProducts, product]);
        }
      }}
    >
      <div className="flex items-center gap-2">
        {isSelected && (
          <Icon
            iconClassName="text-green-500"
            icon={allIcons.solid.faCircleCheck}
          />
        )}
        <div>
          <div className="w-16 h-16">
            <img
              src={photo}
              alt={product.name}
              className="rounded-full w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-bold">{product.name}</span>
          <span className="text-green-500">{price.total}DA</span>
        </div>
      </div>
    </div>
  );
};
interface UpsertCollectionProps {
  collection?: SnapBuy.Collection;
  back?: boolean;
}
export const UpsertCollection = ({
  collection,
  back,
}: UpsertCollectionProps) => {
  useEffect(() => {
    photoState.set(collection?.photo || "");
    setFieldValue("collection-name", collection?.name || "");
  }, []);
  const storeId = useStoreId();
  const products = useAsyncMemo(async () => {
    if (!storeId) return [];
    return await snapbuyApi.getProductsOf(storeId);
  }, [storeId]);
  const selectedProducts = useCopyState<SnapBuy.Product[]>([]);
  const loadingProducts = useCopyState(false);
  useAsyncEffect(async () => {
    loadingProducts.set(true);
    await delay(500);
    const products = await mapAsync(
      collection?.products || [],
      async (prodId) => {
        const prod = await snapbuyApi.getProduct(prodId);
        return prod!;
      }
    );
    loadingProducts.set(false);
    selectedProducts.set(products);
  }, []);
  const unSelectedProducts = useMemo(() => {
    return products?.filter(
      (product) => !selectedProducts.get.some((p) => p.id === product.id)
    );
  }, [products, selectedProducts.get]);
  const value = getFieldValue("search-products-for-collection");
  const filterdProducts = useMemo(() => {
    const filterdList = filterFuzzySearch(
      unSelectedProducts || [],
      value || "",
      "name"
    );
    return [
      ...selectedProducts.get.sort((prod1, prod2) => {
        if (prod1.name && prod2.name) {
          return prod1.name.localeCompare(prod2.name);
        }
        return 0;
      }),
      ...filterdList,
    ];
  }, [selectedProducts.get, unSelectedProducts, value]);
  useEffect(() => {
    setTab("upsert-collection", "upsert-collection");
  }, []);
  const photoState = useCopyState<string | Nothing>(collection?.photo);
  const name = getFieldValue("collection-name");
  const upsertCollection = useAction(
    "upsert-collection",
    async () => {
      if (!storeId) {
        showToast("Store ID is required");
        throw new Error("Store ID is required");
      }
      if (!name) {
        showToast("Collection name is required");
        throw new Error("Collection name is required");
      }
      const id = collection?.id || crypto.randomUUID();
      var photo: string | null = null;
      if (photoState.get) {
        const blob = await fetch(photoState.get).then((r) => r.blob());
        const ref = [
          "projects",
          import.meta.env.VITE_PROJECT_ID,
          "stores",
          storeId,
          "collections",
          id,
        ];
        await updateFile(ref, blob);
        photo = await getDownloadURL(ref);
      }
      const options: SnapBuy.Collection = {
        id,
        ...collection,
        name,
        storeId,
        products: selectedProducts.get?.map((p) => p.id!) || [],
      };
      if (photo) {
        options.photo = photo;
      }
      await snapbuyApi.upsertCollection(options);
    },
    [collection, photoState.get, selectedProducts.get]
  );
  const loading = isLoading(upsertCollection);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-4">
        <div className="flex items-center gap-2">
          {back && (
            <div>
              <CircleTip
                onClick={() => {
                  closePopup();
                  showPopup(<Collections />);
                }}
                icon={allIcons.solid.faChevronLeft}
              />
            </div>
          )}
          <h1 className="text-2xl">
            <Translate
              content={collection ? "Update Collection" : "Create Collection"}
            />
          </h1>
        </div>
        <div>
          <CircleTip
            onClick={() => {
              closePopup();
            }}
            icon={allIcons.solid.faXmark}
          />
        </div>
      </div>
      <Line />
      <TabContent
        identifier="upsert-collection"
        className="flex flex-col h-full overflow-hidden"
        value="upsert-collection"
      >
        <div className="p-2">
          <Field
            className="rounded-xl"
            inputName="search-products-for-collection"
            placeholder="Search Products For Collection"
          />
        </div>
        <Line />
        <Scroll>
          {!loadingProducts.get && (
            <div className="flex flex-wrap items-center">
              {filterdProducts.map((product) => {
                return (
                  <ProductRender
                    key={product.id}
                    product={product}
                    selectedProducts={selectedProducts.get}
                    onChangeSelectedProducts={(products) => {
                      selectedProducts.set(products);
                    }}
                  />
                );
              })}
            </div>
          )}
          {loadingProducts.get && <CardWait className="w-full h-full" />}
        </Scroll>
        <Line />
        <div className="flex gap-2 p-2">
          {collection?.id && (
            <Button
              onClick={async () => {
                const response = await confirm({
                  title: "Delete Collection",
                  message: `Are you sure you want to delete \`${collection.name}\`?`,
                  detail: "This action cannot be undone.",
                });
                if (response) {
                  snapbuyApi.deleteCollection(collection.id!);
                }
              }}
              className="bg-[--biqpod-error] rounded-full"
            >
              <Translate content="delete collection" />
            </Button>
          )}
          <Button
            className="rounded-full"
            rightIcon={allIcons.solid.faChevronRight}
            onClick={() => {
              setTab("upsert-collection", "upsert-collection-next");
            }}
          >
            <Translate content={"next"} />
          </Button>
        </div>
      </TabContent>
      <TabContent
        identifier="upsert-collection"
        className="flex flex-col h-full overflow-hidden"
        value="upsert-collection-next"
      >
        <div className="p-2">
          <ImageField state={photoState} id="collection-photo" />
        </div>
        <Line />
        <div className="p-2">
          <Field
            inputName="collection-name"
            placeholder="Collection Name"
            defaultValue={collection?.name}
            className="rounded-xl"
          />
        </div>
        <Line />
        <Scroll>
          <div className="flex flex-wrap">
            {selectedProducts.get.map((prod) => {
              return (
                <ProductRender
                  product={prod}
                  selectedProducts={selectedProducts.get}
                  onChangeSelectedProducts={(products) => {
                    selectedProducts.set(products);
                  }}
                  key={prod.id}
                />
              );
            })}
          </div>
        </Scroll>
        <Line />
        <div className="flex gap-2 p-2">
          <Button
            className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
            onClick={() => {
              setTab("upsert-collection", "upsert-collection");
            }}
            icon={allIcons.solid.faChevronLeft}
          >
            <Translate content={"back"} />
          </Button>
          <Button
            className="rounded-full"
            iconClassName={tw(loading && "animate-spin")}
            icon={
              loading
                ? allIcons.solid.faSpinner
                : collection
                ? allIcons.solid.faPen
                : allIcons.solid.faPlus
            }
            onClick={() => {
              execAction("upsert-collection");
            }}
          >
            <Translate content={"create"} />
          </Button>
        </div>
      </TabContent>
    </Card>
  );
};
