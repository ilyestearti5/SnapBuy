import { allIcons, getDownloadURL } from "@biqpod/app/ui/apis";
import exceljs from "exceljs";
import {
  Button,
  Card,
  CircleLoading,
  Field,
  Icon,
  Line,
  PositionView,
  Translate,
} from "@biqpod/app/ui/components";
function filterFuzzySearch<T>(list: T[], search: string, key: keyof T): T[] {
  if (!search) return list;
  const normSearch = search.trim().toLowerCase();
  // Score function: higher is better
  function score(str: string): number {
    str = str.toLowerCase();
    if (str === normSearch) return 1000; // exact match
    if (str.startsWith(normSearch)) return 900; // prefix match
    const idx = str.indexOf(normSearch);
    if (idx !== -1) return 800 - idx; // substring match, earlier is better
    // Fuzzy: count matching chars in order
    let sIdx = 0,
      match = 0;
    for (let c of str) {
      if (c === normSearch[sIdx]) {
        match++;
        sIdx++;
        if (sIdx === normSearch.length) break;
      }
    }
    return match === normSearch.length ? 700 - str.length : 0;
  }
  return list
    .map((item) => {
      const value = String(item[key] ?? "");
      return { item, score: score(value) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
import {
  execAction,
  getFieldValue,
  getPosition,
  handelShadowColor,
  isLoading,
  isSuccess,
  setTemp,
  showPopup,
  useAction,
  useColorMerge,
  useCopyState,
  useMemoDelay,
  useResolution,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFullCart, useSearchParams } from "./AddProductToCart";
import { CartPopup } from "./CartPopup";
import { ClientProductRender } from "./ClientProductRender";
import { useParams } from "react-router";
import { FixedSizeList as List } from "react-window";
import { allKeys } from "./Links/Products";
import { tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "./apis";
import { arraySeparator } from "./utils";
export const ClientProducts = () => {
  const storeId = useParams<{ uid: string }>().uid;
  const products = useCopyState<SnapBuy.Product[]>([]); // Replace with your actual product data
  const lastDoc = useCopyState<SnapBuy.Product | null>(null);
  const action = useAction(
    "fetch-store-products",
    async (next = false) => {
      if (!storeId) {
        return;
      }
      if (next) {
        return;
      }
      const store = await snapbuyApi.getStore(storeId);
      const uri =
        store?.accessLink ||
        (await getDownloadURL([
          "projects",
          import.meta.env.VITE_PROJECT_ID,
          "stores",
          storeId,
          "products.xlsx",
        ]));
      if (!uri) {
        return;
      }
      const blob = await fetch(uri).then((res) => res.blob());
      const workbook = new exceljs.Workbook();
      await workbook.xlsx.load(await blob.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      const newProducts: SnapBuy.Product[] = [];
      const array = worksheet.getSheetValues();
      for (let index = 2; index < array.length; index++) {
        const row = array[index];
        if (!Array.isArray(row)) return;
        const product: SnapBuy.Product = {};
        allKeys.forEach((key, colIdx) => {
          const i = colIdx + 1;
          switch (key) {
            case "single.price":
              product.single = {
                price: row[i] ? Number(row[i]) : undefined,
              };
              break;
            case "multiple.prices":
              product.multiple = {
                prices:
                  row[i]
                    ?.toString()
                    ?.split(arraySeparator)
                    .map((p) => ({ price: Number(p), quantity: 1 })) ||
                  undefined,
              };
              break;
            case "multiple.counts": {
              if (!product.multiple) product.multiple = {};
              const counts =
                row[i]
                  ?.toString()
                  ?.split(arraySeparator)
                  .map((c) => Number(c)) || [];
              if (
                product.multiple.prices &&
                counts.length === product.multiple.prices.length
              ) {
                product.multiple.prices = product.multiple.prices.map(
                  (priceObj, i) => ({ ...priceObj, quantity: counts[i] })
                );
              }
              break;
            }
            case "available":
              product.available = row[i] === "true";
              break;
            case "photos": {
              const photos = row[i]
                ?.toString()
                .split(arraySeparator)
                .filter(Boolean);
              product.photos = photos;
              break;
            }
            case "quantity": {
              product.quantity = Number(row[i]?.toString() || "");
              break;
            }
            case "keys":
              product.keys = row[i]
                ?.toString()
                ?.split(arraySeparator)
                .map((key) => key.trim())
                .filter((key) => key.length > 0);
              break;
            case "limited":
              product.limited = row[i] === "true";
              break;
            default:
              product[key] = row[i]?.toString() || "";
          }
        });
        if (product.available) {
          newProducts.push(product);
        }
      }
      products.set(newProducts);
    },
    [storeId, lastDoc.get]
  );
  const success = isSuccess(action);
  useEffect(() => {
    if (storeId) {
      execAction("fetch-store-products");
    }
  }, [storeId]);
  const search = getFieldValue("search-prod");
  const [_, filterProducts] = useMemoDelay(
    () => {
      if (!search) {
        return products.get;
      }
      return filterFuzzySearch(products.get, search, "name");
    },
    [products.get, search],
    200
  );
  const cart = useFullCart(storeId);
  const loading = isLoading(action);
  const listRef = useRef<any>(null); // Ref for the List component
  const scrollState = useRef(0); // Use useRef for scroll position
  const [showShadow, setShowShadow] = useState(false); // State to control shadow visibility
  useEffect(() => {
    setTemp("client-store-id", storeId);
  }, [storeId]);
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem?.(0);
    }
  }, [search]);
  // useEffect(() => {
  //   if (user?.uid && storeUser?.uid) {
  //     snapbuyApi.isFollowing(storeUser.uid).then((isYes) => {
  //       if (!isYes) {
  //         showPopup(
  //           <Card
  //             style={{
  //               ...colorMerge({
  //                 boxShadow: handelShadowColor([
  //                   {
  //                     colorId: "shadow.color",
  //                     x: 0,
  //                     y: 0,
  //                     blur: 30,
  //                     size: 10,
  //                   },
  //                 ]),
  //               }),
  //             }}
  //             className="w-1/2 min-w-[200px] max-w-[300px]"
  //           >
  //             <div className="flex justify-between items-center p-2">
  //               <span className="font-bold text-2xl capitalize">
  //                 <Translate content="follow" />
  //               </span>
  //               <div>
  //                 <CircleTip
  //                   icon={allIcons.solid.faXmark}
  //                   onClick={() => {
  //                     closePopup();
  //                   }}
  //                 />
  //               </div>
  //             </div>
  //             <Line />
  //             <div className="flex flex-col justify-center items-center gap-2 p-2">
  //               <Image
  //                 className="w-[100px] h-[100px]"
  //                 src={storeUser.photo ?? undefined}
  //                 alt={<Icon icon={allIcons.solid.faUser} />}
  //               />
  //               <span>
  //                 {storeUser.firstname} {storeUser.lastname}
  //               </span>
  //             </div>
  //             <Line />
  //             <div className="p-2">
  //               <Button
  //                 className="rounded-full"
  //                 onClick={async () => {
  //                   closePopup();
  //                   await snapbuyApi.follow(storeUser?.uid!);
  //                 }}
  //               >
  //                 <Translate content="follow" />
  //               </Button>
  //             </div>
  //           </Card>,
  //           {
  //             type: "blur",
  //           }
  //         );
  //       }
  //     });
  //   }
  // }, [user?.uid, storeUser]);
  const position = getPosition("searching");
  const { height } = useResolution();
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return height - posHeight - posTop;
  }, [position, height]);
  const { showPhoto } = useSearchParams();
  const colorMerge = useColorMerge();
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <PositionView positionId="searching">
        <div className="flex justify-between items-center gap-2 p-2">
          <div className="relative flex justify-center w-full">
            <Field
              className="rounded-2xl"
              placeholder="Search Product"
              inputName="search-prod"
              propositions={["@cart"]}
            />
            <span className="top-1/2 right-2 absolute font-bold text-[--biqpod-primary] -translate-y-1/2">
              / {filterProducts?.length || 0}
            </span>
          </div>
        </div>
        <Line />
      </PositionView>
      {success && (
        <div className="relative h-full overflow-hidden">
          {showShadow && (
            <div
              style={{
                ...colorMerge({
                  boxShadow: handelShadowColor([
                    {
                      x: 0,
                      y: 0,
                      blur: 20,
                      size: 5,
                      colorId: "shadow.color",
                    },
                  ]),
                }),
              }}
              className="top-[-30px] z-[10000] absolute inset-x-0 shadow-xl h-[30px]"
            />
          )}
          {!!filterProducts?.length && (
            <List
              ref={listRef}
              height={listHeight}
              itemCount={Math.ceil((filterProducts?.length + 1) / 2)}
              itemSize={showPhoto ? 340 : 220}
              width={"100%"}
              itemData={[...filterProducts, 0]}
              onScroll={(e) => {
                scrollState.current = e.scrollOffset || 0;
                setShowShadow((e.scrollOffset || 0) > 40);
              }}
            >
              {({
                index,
                style,
                data,
              }: {
                index: number;
                style: React.CSSProperties;
                data: (SnapBuy.Product | number)[];
              }) => {
                if (typeof data === "number") {
                  return <div style={style} />;
                }
                const first = data?.at(index * 2);
                const second = data?.at(index * 2 + 1);
                return (
                  <div style={style} className="flex items-center gap-2 p-2">
                    {typeof first == "object" && (
                      <ClientProductRender
                        index={index * 2}
                        product={first}
                        key={first.id}
                      />
                    )}
                    {typeof second == "object" && (
                      <ClientProductRender
                        index={index * 2 + 1}
                        product={second}
                        key={second.id}
                      />
                    )}
                  </div>
                );
              }}
            </List>
          )}
          {filterProducts?.length === 0 && (
            <div className="flex justify-center items-center w-full h-full">
              <Card>
                <div className="flex justify-center items-center p-2 h-full">
                  <Icon
                    icon={allIcons.solid.faBoxOpen}
                    iconClassName="text-9xl text-[--biqpod-primary]"
                  />
                </div>
                <Line />
                <div className="flex justify-center items-center p-4 h-full text-2xl capitalize">
                  <Translate content="no products found" />
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
      {loading && (
        <div className="flex justify-center items-center h-full">
          <CircleLoading />
        </div>
      )}
      <PositionView
        positionId="click-see-cart"
        className={tw(
          "absolute bottom-0 inset-x-0 bg-[--biqpod-primary-background] transition-[bottom] duration-300",
          !cart.length && "bottom-[-200px]"
        )}
      >
        <Line />
        <div className="p-2">
          <Button
            className="rounded-full"
            icon={allIcons.solid.faShoppingCart}
            onClick={() => {
              showPopup(<CartPopup storeId={storeId} />);
            }}
          >
            <Translate content="see cart" />
          </Button>
        </div>
      </PositionView>
    </div>
  );
};
