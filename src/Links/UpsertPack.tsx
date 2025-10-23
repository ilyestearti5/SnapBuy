import { allIcons } from "@biqpod/app/ui/apis";
import {
  AsyncComponent,
  Button,
  Card,
  CardWait,
  CircleTip,
  Field,
  Icon,
  Image,
  Key,
  Line,
  NumberField,
  Scroll,
  Tip,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  getTemp,
  setFieldValue,
  showPopup,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { filterFuzzySearch, setFocused, tw } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { snapbuyApi } from "../apis";
import { Packs } from "./Packs";
interface PackLineProductProps {
  product?: Snapbuy.Product | null;
  onChange?: (prod: Snapbuy.Product, count: number) => void;
  onDelete?: (prod: Snapbuy.Product) => void;
  count?: number;
}
const PackLineProduct = ({
  product,
  onChange,
  onDelete,
  count = 1,
}: PackLineProductProps) => {
  const photo = product?.photos?.at(0);
  const prices =
    product?.type === "multiple"
      ? product?.multiple?.prices?.map((price) => price.price)
      : [product?.single?.client || 0];
  return (
    <Card className="w-fit">
      <div className="flex items-center gap-1 p-1">
        <div className="flex items-center gap-2">
          <Image
            src={photo}
            alt={<Icon icon={allIcons.solid.faBoxOpen} />}
            className="bg-[--biqpod-gray-opacity] w-[40px] h-[40px]"
          />
          <div>{product?.name}</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex flex-wrap gap-1 text-[--biqpod-primary]">
            {prices?.map((price, index) => {
              return (
                <Key
                  className="text-[--biqpod-success] max-md:text-xs"
                  key={index}
                >
                  {price}DA
                </Key>
              );
            })}
          </div>
          <div className="flex items-center">
            <CircleTip
              className="flex-1"
              onClick={() => {
                if (count <= 1) return;
                product && onChange?.(product, count - 1);
              }}
              icon={allIcons.solid.faMinus}
            />
            <input
              type="number"
              placeholder="0"
              value={count === 0 ? "" : count}
              min={0}
              max={1000}
              onChange={(e) => {
                const val = e.target.value;
                const newCount = val === "" ? 0 : Number(val);
                if (!isNaN(newCount) && newCount >= 0 && newCount <= 1000) {
                  product && onChange?.(product, newCount);
                }
              }}
              className="bg-transparent border-none outline-none focus:ring-0 w-10 text-center"
              style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
            />
            <CircleTip
              className="flex-1"
              onClick={() => {
                product && onChange?.(product, count + 1);
              }}
              icon={allIcons.solid.faPlus}
            />
            <CircleTip
              className="flex-1"
              icon={allIcons.solid.faTrashCan}
              onClick={() => {
                product && onDelete?.(product);
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
interface UpsertPackProps {
  pack?: Snapbuy.Pack;
  back?: boolean;
}
export const UpsertPack = ({ pack, back }: UpsertPackProps) => {
  const priceState = useCopyState<number | null | undefined>(0);
  const addedProducts = useCopyState<Required<Snapbuy.Pack>["products"]>([]);
  const products = getTemp<Snapbuy.Product[]>("fetched-products"); // Replace with your actual product data
  const searchField = getFieldValue("pack-search");
  const filterdProducts = useMemo(() => {
    return filterFuzzySearch(products || [], searchField?.trim() || "", "name");
  }, [products, searchField]);
  useEffect(() => {
    priceState.set(pack?.price);
    addedProducts.set(pack?.products || []);
    setFieldValue("pack-name", pack?.name || "");
  }, [pack]);
  const packName = getFieldValue("pack-name");
  return (
    <Card className="relative max-md:rounded-none max-md:w-full md:w-[75vw] max-md:h-full overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-2">
          {back && (
            <div>
              <CircleTip
                onClick={() => {
                  showPopup(<Packs />);
                }}
                icon={allIcons.solid.faArrowLeft}
              />
            </div>
          )}
          <h1 className="font-bold text-2xl">
            <Translate content={pack ? "Modify pack" : "Create pack"} />
          </h1>
        </div>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div className="p-2">
        <div className="flex max-md:flex-col md:items-center gap-2 mb-2">
          <label className="w-full md:text-right">
            <Translate content="name" /> :
          </label>
          <Field inputName="pack-name" placeholder="name" />
        </div>
        <div className="flex max-md:flex-col md:items-center gap-2">
          <label className="w-full md:text-right">
            <Translate content="price" /> :
          </label>
          <div className="relative w-full">
            <NumberField
              state={priceState}
              config={{
                placeholder: "price",
                autoChange: true,
              }}
              id="pack-price"
            />
            <Tip
              className="top-1/2 right-2 absolute -translate-y-1/2"
              icon={allIcons.solid.faBrain}
              onClick={() => {
                // Calculate the sum of all added product prices
                const productsList = products || [];
                let total = 0;
                addedProducts.get.forEach((prodRecord) => {
                  const prod = productsList.find(
                    (p) => p.id === prodRecord.prodId
                  );
                  if (prod) {
                    const count = prodRecord.count || 1;
                    if (
                      prod.type === "multiple" &&
                      prod.multiple?.prices?.length
                    ) {
                      // Use the lowest price for multiple type
                      const minPrice = Math.max(
                        ...prod.multiple.prices.map((p) => p.price)
                      );
                      total += minPrice * count;
                    } else if (prod.single?.client) {
                      total += prod.single.client * count;
                    }
                  }
                });
                priceState.set(total);
              }}
              content="Auto-calculate from products"
            />
          </div>
        </div>
      </div>
      <Line />
      <Scroll>
        {addedProducts.get.length === 0 && (
          <div className="flex flex-col justify-end items-center gap-2 p-4 h-full">
            <Card
              className="active:bg-[--biqpod-gray-opacity] w-full scale-100 active:scale-95 transition-[transform] cursor-pointer"
              onClick={() => {
                setFocused("pack-search");
              }}
            >
              <div className="flex items-center gap-2 p-2">
                <CircleTip icon={allIcons.solid.faArrowDown} />
                <h1>
                  <Translate content="type to search for products and add them to the pack" />
                </h1>
              </div>
            </Card>
          </div>
        )}
        {!!addedProducts.get.length && (
          <div className="flex flex-wrap gap-1 p-2">
            {addedProducts.get.map((prodRecord, index) => {
              return (
                <motion.div
                  key={prodRecord.prodId}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: index * 0.08,
                    type: "spring",
                    stiffness: 60,
                    duration: 0.5,
                  }}
                >
                  <AsyncComponent
                    deps={[prodRecord.prodId, addedProducts.get]}
                    render={async () => {
                      const product = await snapbuyApi.product.get(
                        prodRecord.prodId
                      );
                      return (
                        <PackLineProduct
                          product={product}
                          onDelete={() => {
                            addedProducts.set((prev) =>
                              prev.filter((p) => p.prodId !== prodRecord.prodId)
                            );
                          }}
                          onChange={(prod, count) => {
                            addedProducts.set((prev) =>
                              prev.map((p) =>
                                p.prodId === prod.id ? { ...p, count } : p
                              )
                            );
                          }}
                          count={prodRecord.count}
                        />
                      );
                    }}
                    loading={
                      <Card key={index} className="rounded-2xl w-fit">
                        <div className="flex items-center gap-1 p-1">
                          <div className="flex items-center gap-2">
                            <CardWait className="rounded-full w-[40px] h-[40px]" />
                            <CardWait className="rounded-2xl w-[120px] h-[20px]" />
                          </div>
                          <div className="flex items-center">
                            <CardWait className="rounded-2xl w-[100px] h-[20px]" />
                          </div>
                        </div>
                      </Card>
                    }
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </Scroll>
      <Line />
      <div className="flex flex-col items-center">
        <div className="w-full max-h-[400px] overflow-y-auto">
          {searchField &&
            filterdProducts
              .map((product) => {
                const isExists = addedProducts.get.find(
                  (prod) => prod.prodId === product.id
                );
                return {
                  product,
                  isExists,
                };
              })
              .sort((prev, current) => {
                // make the products that are already added to the pack appear last
                if (prev.isExists && !current.isExists) return 1;
                if (!prev.isExists && current.isExists) return -1;
                return 0;
              })
              .map(({ product, isExists }, index) => {
                const photo = product?.photos?.at(0);
                const prices =
                  product?.type === "multiple"
                    ? product?.multiple?.prices?.map((p) => p.price)
                    : [product?.single?.client || 0];
                return (
                  <motion.div
                    key={index}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      delay: index * 0.08,
                      type: "spring",
                      stiffness: 60,
                      duration: 0.5,
                    }}
                    className="flex justify-between items-center active:bg-[--biqpod-gray-opacity] odd:bg-[--biqpod-primary-background] p-2 cursor-pointer"
                    onClick={() => {
                      if (isExists) {
                        return;
                      }
                      addedProducts.set((prev) => [
                        ...prev,
                        { count: 1, prodId: product.id! },
                      ]);
                      setFieldValue("pack-search", "");
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={allIcons.solid.faCheckCircle}
                        iconClassName={tw(
                          "text-[--biqpod-success] invisible",
                          isExists && "visible"
                        )}
                      />
                      <Image
                        src={photo}
                        alt={<Icon icon={allIcons.solid.faBoxOpen} />}
                        className="bg-[--biqpod-gray-opacity] w-[50px] h-[50px]"
                      />
                      <div>{product.name}</div>
                    </div>
                    <div className="text-[--biqpod-primary]">
                      {prices?.map((price) => `${price}DA`).join(" ,")}
                    </div>
                  </motion.div>
                );
              })}
        </div>
        <Line />
        <div className="p-2 w-full">
          <Field
            inputName="pack-search"
            className="rounded-xl"
            placeholder="search for product"
            propositions={products
              ?.map((prod) => (prod.name ? prod.name.toLowerCase() : ""))
              .filter(Boolean)}
            onKeyDown={(e) => {
              if (filterdProducts.length === 1 && e.key === "Enter") {
                const product = filterdProducts[0];
                const isExists = addedProducts.get.find(
                  (prod) => prod.prodId === product.id
                );
                if (!isExists) {
                  addedProducts.set((prev) => [
                    ...prev,
                    { count: 1, prodId: product.id! },
                  ]);
                  setFieldValue("pack-search", "");
                }
              }
            }}
          />
        </div>
      </div>
      <Line />
      <div className="flex justify-between items-center p-2">
        <Button
          icon={allIcons.solid.faPlus}
          onClick={async () => {
            if (!priceState.get) {
              const response = await confirm({
                title: "Price is not set",
                message: "Do you want to set the price to 0?",
              });
              if (!response) {
                return;
              }
            }
            const options: Snapbuy.Pack = {
              name: packName,
              price: priceState.get || 0,
              products: addedProducts.get,
              id: pack?.id,
            };
            execAction("upsert-pack", options);
            setFieldValue("pack-name", "");
            priceState.set(0);
            addedProducts.set([]);
            closePopup();
          }}
        >
          <Translate content="add pack" />
        </Button>
      </div>
    </Card>
  );
};
