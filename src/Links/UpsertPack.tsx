import { allIcons } from "@biqpod/app/ui/apis";
import {
  AsyncComponent,
  Button,
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
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
  setFieldValue,
  setTemp,
  showPopup,
  showToast,
  useCopyState,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { filterFuzzySearch, setFocused, tw } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { Packs } from "./Packs";
import { Biqpod } from "@biqpod/app/ui/types";
// Helper function for fuzzy highlighting
const highlightFuzzy = (text: string, query: string): React.ReactNode => {
  if (!query || query.trim() === "") return text;
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase();
  // Find all matches for highlighting
  const matches: { start: number; end: number }[] = [];
  // Exact substring matches
  let index = textLower.indexOf(queryLower);
  while (index !== -1) {
    matches.push({ start: index, end: index + queryLower.length });
    index = textLower.indexOf(queryLower, index + 1);
  }
  // If no exact matches, try fuzzy matching
  if (matches.length === 0) {
    let queryIdx = 0;
    for (let i = 0; i < text.length && queryIdx < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIdx]) {
        matches.push({ start: i, end: i + 1 });
        queryIdx++;
      }
    }
  }
  if (matches.length === 0) return text;
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  // Merge overlapping matches
  const mergedMatches: { start: number; end: number }[] = [];
  for (const match of matches) {
    if (mergedMatches.length === 0) {
      mergedMatches.push(match);
    } else {
      const last = mergedMatches[mergedMatches.length - 1];
      if (match.start <= last.end) {
        last.end = Math.max(last.end, match.end);
      } else {
        mergedMatches.push(match);
      }
    }
  }
  // Build the highlighted text
  const result: React.ReactNode[] = [];
  let lastEnd = 0;
  mergedMatches.forEach((match, idx) => {
    // Add text before the match
    if (match.start > lastEnd) {
      result.push(text.substring(lastEnd, match.start));
    }
    // Add highlighted match
    result.push(
      <span key={idx} className="font-bold text-[--biqpod-primary] underline">
        {text.substring(match.start, match.end)}
      </span>
    );
    lastEnd = match.end;
  });
  // Add remaining text
  if (lastEnd < text.length) {
    result.push(text.substring(lastEnd));
  }
  return result;
};
interface PackLineProductProps {
  product?: Biqpod.Snapbuy.Product | null;
  onChange?: (prod: Biqpod.Snapbuy.Product, count: number) => void;
  onDelete?: (prod: Biqpod.Snapbuy.Product) => void;
  count?: number;
}
const PackLineProduct = ({
  product,
  onChange,
  onDelete,
  count = 1,
}: PackLineProductProps) => {
  const photo = product?.files?.at(0)?.url;
  const prices =
    product?.type === "multiple"
      ? product?.multiple?.prices?.map((price) => price.price)
      : [product?.single?.client || 0];
  return (
    <Card>
      <div className="flex items-center gap-1 px-2 py-1">
        <div className="flex items-center gap-2">
          <div>
            <Image
              src={photo}
              alt={<Icon icon={allIcons.solid.faBoxOpen} />}
              className="bg-[--biqpod-gray-opacity] rounded-xl w-[40px] h-[40px]"
            />
          </div>
          <span className="text-nowrap">{product?.name}</span>
        </div>
        <div className="flex justify-between gap-1 w-full">
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
            <Tip
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
              className="bg-[--biqpod-primary-background] border border-[--biqpod-borders] border-solid rounded-xl outline-none focus:ring-0 w-10 text-center"
              style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
            />
            <Tip
              className="flex-1"
              onClick={() => {
                product && onChange?.(product, count + 1);
              }}
              icon={allIcons.solid.faPlus}
            />
            <Tip
              className="flex-1"
              icon={allIcons.solid.faTrashCan}
              onClick={async () => {
                const response = await confirm({
                  title: "Delete Product from Pack",
                  message: `Are you sure you want to remove \`${
                    product?.name || "Unnamed"
                  }\` from the pack?`,
                });
                if (response) product && onDelete?.(product);
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
interface UpsertPackProps {
  pack?: Biqpod.Snapbuy.Pack;
  back?: boolean;
}
export const UpsertPack = ({ pack, back }: UpsertPackProps) => {
  const priceState = useCopyState<Biqpod.System.Setting.Value["number"]>(0);
  const addedProducts = useCopyState<Required<Biqpod.Snapbuy.Pack>["products"]>(
    []
  );
  const storeId = useStoreId();
  const products = useTemp<Biqpod.Snapbuy.Product[]>("fetched-products");
  const searchField = getFieldValue("pack-popup-search");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const filterdProducts = useMemo(() => {
    return filterFuzzySearch(
      products.get || [],
      searchField?.trim() || "",
      "name"
    );
  }, [products.get, searchField]);
  useEffect(() => {
    if (!storeId) return;
    snapbuyApi.product.getProductsOf(storeId).then((fetchedProducts) => {
      setTemp("fetched-products", fetchedProducts || []);
    });
  }, [storeId]);
  useEffect(() => {
    priceState.set(pack?.price);
    addedProducts.set(pack?.products || []);
    setFieldValue("pack-name", pack?.name || "");
  }, [pack]);
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!searchField) return;
      const totalItems = filterdProducts.length;
      if (totalItems === 0) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < totalItems) {
            const product = filterdProducts[selectedIndex];
            const isExists = addedProducts.get.find(
              (prod) => prod.prodId === product.id
            );
            if (!isExists) {
              addedProducts.set((prev) => [
                ...prev,
                { count: 1, prodId: product.id! },
              ]);
              setFieldValue("pack-popup-search", "");
            }
            setSelectedIndex(-1);
          }
          break;
        case "Escape":
          setFieldValue("pack-popup-search", "");
          setSelectedIndex(-1);
          break;
      }
    };
    if (searchField) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchField, selectedIndex, filterdProducts, addedProducts]);
  // Reset selected index when search field changes
  useEffect(() => {
    if (searchField) {
      setSelectedIndex(-1);
      itemRefs.current = [];
    }
  }, [searchField]);
  // Auto-scroll selected item into view
  useEffect(() => {
    const container = document.getElementById("pack-dropdown");
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex] && container) {
      const item = itemRefs.current[selectedIndex];
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      if (itemRect.bottom > containerRect.bottom) {
        container.scrollTop += itemRect.bottom - containerRect.bottom;
      } else if (itemRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - itemRect.top;
      }
    }
  }, [selectedIndex]);
  // Update itemRefs array size
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filterdProducts.length);
  }, [filterdProducts]);
  const packName = getFieldValue("pack-name");
  return (
    <Card className="relative flex flex-col max-md:rounded-none max-md:w-full md:w-[75vw] h-[80vh] max-md:h-full">
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
          <h1 className="font-bold text-2xl capitalize">
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
          <Field inputName="pack-name" placeholder="Enter Name" />
        </div>
        <div className="flex max-md:flex-col md:items-center gap-2">
          <label className="w-full md:text-right">
            <Translate content="price" /> :
          </label>
          <div className="relative w-full">
            <NumberField
              state={priceState}
              config={{
                placeholder: "Enter Price",
                autoChange: true,
              }}
              id="pack-price"
            />
            <Tip
              className="top-1/2 right-2 absolute -translate-y-1/2"
              icon={allIcons.solid.faBrain}
              onClick={() => {
                // Calculate the sum of all added product prices
                const productsList = products.get || [];
                if (!productsList.length) {
                  showToast(
                    "No products available to calculate price",
                    "error"
                  );
                  return;
                }
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
      <div className="flex flex-col h-full">
        <Scroll>
          {!addedProducts.get.length && (
            <div className="flex flex-col justify-end items-center gap-2 p-4 h-full">
              <Card
                className="active:bg-[--biqpod-gray-opacity] w-full scale-100 active:scale-95 transition-[transform] cursor-pointer"
                onClick={() => {
                  setFocused("pack-popup-search");
                }}
              >
                <div className="flex items-center gap-2 p-2">
                  <CircleTip icon={allIcons.solid.faArrowDown} />
                  <h1 className="capitalize">
                    <Translate content="type to search for products and add them to the pack" />
                  </h1>
                </div>
              </Card>
            </div>
          )}
          {!!addedProducts.get.length && (
            <div className="flex flex-wrap gap-1 p-1">
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
                    className="w-[calc(50%-2px)] max-md:w-full"
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
                                prev.filter(
                                  (p) => p.prodId !== prodRecord.prodId
                                )
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
      </div>
      <Line />
      <div className="relative p-2 w-full">
        <Field
          inputName="pack-popup-search"
          className="rounded-xl"
          placeholder="Search For Products to Add"
          propositions={products.get
            ?.map((prod) => prod.name)
            .filter((name): name is string => Boolean(name))}
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
                setFieldValue("pack-popup-search", "");
              }
            }
          }}
        />
        {searchField && (
          <Card
            id="pack-dropdown"
            className="right-0 bottom-[calc(90%+10px)] z-[1000000000000000000000] absolute w-3/4 max-md:w-full max-h-60 overflow-y-auto"
          >
            {filterdProducts
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
                const photo = product?.files?.at(0)?.url;
                const prices =
                  product?.type === "multiple"
                    ? product?.multiple?.prices?.map((p) => p.price)
                    : [product?.single?.client || 0];
                const isSelected = selectedIndex === index;
                return (
                  <motion.div
                    key={index}
                    ref={(el) => (itemRefs.current[index] = el)}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      delay: index * 0.08,
                      type: "spring",
                      stiffness: 60,
                      duration: 0.5,
                    }}
                    className={tw(
                      "flex justify-between border-b border-solid border-[--biqpod-borders] items-center p-2 cursor-pointer",
                      isSelected &&
                        "bg-[--biqpod-primary] text-[--biqpod-primary-content]",
                      !isSelected &&
                        "hover:bg-[--biqpod-gray-opacity] active:bg-[--biqpod-gray-opacity-2]"
                    )}
                    onClick={() => {
                      if (isExists) {
                        return;
                      }
                      addedProducts.set((prev) => [
                        ...prev,
                        { count: 1, prodId: product.id! },
                      ]);
                      setFieldValue("pack-popup-search", "");
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={allIcons.solid.faCheckCircle}
                        className={tw(
                          "text-[--biqpod-success]",
                          !isExists && "hidden"
                        )}
                      />
                      <Image
                        src={photo}
                        alt={<Icon icon={allIcons.solid.faBoxOpen} />}
                        className="bg-[--biqpod-gray-opacity] rounded-lg w-[35px] h-[35px] overflow-hidden"
                      />
                      <div>
                        {highlightFuzzy(product.name || "", searchField)}
                        <sub className="ml-3">
                          <AsyncComponent
                            render={async () => {
                              const brandId = product.brandId;
                              if (!brandId) return <EmptyComponent />;
                              const brand = await snapbuyApi.brands.get(
                                brandId
                              );
                              return (
                                <span className="font-bold">
                                  {brand?.name || ""}
                                </span>
                              );
                            }}
                          />
                        </sub>
                      </div>
                    </div>
                    <div
                      className={tw(
                        "text-[--biqpod-primary]",
                        isSelected && "text-[--biqpod-primary-content]"
                      )}
                    >
                      {prices?.map((price) => `${price}DA`).join(" ,")}
                    </div>
                  </motion.div>
                );
              })}
          </Card>
        )}
      </div>
      <Line />
      <div className="p-2">
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
            const options: Biqpod.Snapbuy.Pack = {
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
