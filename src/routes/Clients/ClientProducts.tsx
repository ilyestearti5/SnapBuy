import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  PositionView,
  Scroll,
  TabContent,
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
  closePopup,
  execAction,
  getFieldValue,
  getPosition,
  getTab,
  handelShadowColor,
  isLoading,
  isSuccess,
  openMenu,
  setTab,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useAsyncMemo,
  useColorMerge,
  useCopyState,
  useMemoDelay,
  useResolution,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "./AddProductToCart";
import { useParams } from "react-router";
import { FixedSizeList as List } from "react-window";
import { tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "../../apis";
import { FilesSlider } from "../../Links/FilesSlider";
import { Link } from "react-router-dom";
import { initPixels } from "../../Links/pixles";
import { ClientProductRender } from "./ClientProductRender";
import { CartPopup } from "./CartPopup";
import { useFullCart } from "../../apis/snapbuy";
import { Biqpod } from "@biqpod/app/ui/types";
export const ClientProducts = () => {
  const storeId = useParams<{ storeId: string }>().storeId;
  const store = useAsyncMemo(async () => {
    if (!storeId) return null;
    return snapbuyApi.store.get(storeId);
  }, [storeId]);
  const pixles = initPixels(store);
  const products = useCopyState<Biqpod.Snapbuy.Product[]>([]); // Replace with your actual product data
  const lastDoc = useCopyState<Biqpod.Snapbuy.Product | null>(null);
  const action = useAction(
    "fetch-store-products",
    async (next = false) => {
      if (!storeId) {
        return;
      }
      if (next) {
        return;
      }
      const allProducts = await snapbuyApi.product.getProductsOf(storeId);
      if (allProducts) {
        products.set(allProducts.filter((prod) => prod.available));
      }
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
  const [, filterProducts] = useMemoDelay(
    () => {
      if (!search) {
        return products.get;
      }
      pixles?.search(search);
      return filterFuzzySearch(products.get, search, "name");
    },
    [products.get, search],
    100
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
  const position = getPosition("searching");
  const { height } = useResolution();
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return height - posHeight - posTop;
  }, [position, height]);
  const { showPhoto } = useSearchParams();
  const colorMerge = useColorMerge();
  const packs = useAsyncMemo(async () => {
    return snapbuyApi.packs.getAll(storeId);
  }, [storeId]);
  const selectedTab = getTab("client-products");
  useEffect(() => {
    if (!selectedTab) {
      setTab("client-products", "products");
    }
  }, [selectedTab]);
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <TabContent identifier="client-products" value="products">
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
            {packs && packs.length > 0 && (
              <div>
                <Button
                  className="bg-red-600 rounded-full text-white animate-pulse"
                  onClick={() => {
                    setTab("client-products", "packs");
                  }}
                  rightIcon={allIcons.solid.faChevronRight}
                >
                  <Translate content="offers" />
                </Button>
              </div>
            )}
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
                  data: (Biqpod.Snapbuy.Product | number)[];
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
            {filterProducts && filterProducts?.length === 0 && (
              <div className="flex justify-center items-center w-full h-full">
                <Card>
                  <div className="flex justify-center items-center p-2 h-full">
                    <Icon
                      icon={allIcons.solid.faBoxOpen}
                      className="text-[--biqpod-primary] text-9xl"
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
      </TabContent>
      <TabContent identifier="client-products" value="packs">
        <div className="p-2">
          <Button
            leftIcon={allIcons.solid.faChevronLeft}
            className="rounded-full"
            onClick={() => {
              setTab("client-products", "products");
            }}
          >
            <Translate content="products" />
          </Button>
        </div>
        <Line />
        <Scroll>
          <div className="flex flex-col gap-2 p-2 min-h-full">
            {packs?.map((pack) => {
              return (
                <EmptyComponent key={pack.id}>
                  <Card>
                    <div className="p-2 font-bold text-lg">{pack.name}</div>
                    {pack.products && (
                      <div className="flex flex-col gap-2">
                        {pack.products.map((p) => {
                          const prod = products.get.find(
                            (pr) => pr.id === p.prodId
                          );
                          if (!prod) return null;
                          const prices =
                            prod.type === "single"
                              ? [prod.single?.client || 0]
                              : prod.multiple?.prices?.map(
                                  ({ price }) => price
                                );
                          return (
                            <div
                              key={prod.id}
                              className="flex justify-between items-center gap-2 odd:bg-[--biqpod-primary-background] p-4"
                            >
                              <div className="flex justify-center gap-2">
                                {prod.files && prod.files.length > 0 && (
                                  <img
                                    src={prod.files.at(0)?.url}
                                    alt={prod.name}
                                    onClick={() => {
                                      showPopup(
                                        <Card>
                                          <div className="flex justify-between items-center p-2 h-full">
                                            <h1 className="font-bold text-2xl capitalize">
                                              <Translate content="Product Image" />
                                            </h1>
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
                                          <div className="h-[300px]">
                                            <FilesSlider files={prod.files} />
                                          </div>
                                        </Card>
                                      );
                                    }}
                                    className="rounded w-12 h-12 object-cover"
                                  />
                                )}
                                <span className="font-semibold">
                                  {prod.name}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="text-[--biqpod-primary] text-sm">
                                  {Math.max(...(prices || []))}DA
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Line />
                    {typeof pack.price !== "undefined" && (
                      <div className="flex justify-between items-center p-2">
                        <span className="font-semibold text-green-600 text-base">
                          {pack.price}DA
                        </span>
                        <div className="flex items-center gap-1">
                          <Link to={"/pack/" + pack.id}>
                            <Button className="bg-[--biqpod-primary] rounded-full text-white">
                              <Translate content="view details" />
                            </Button>
                          </Link>
                          <div>
                            <CircleTip
                              icon={allIcons.solid.faEllipsisV}
                              onClick={({ clientX, clientY }) => {
                                openMenu({
                                  x: clientX,
                                  y: clientY,
                                  menu: [
                                    {
                                      label: "Copy Link",
                                      defaultIcon: allIcons.solid.faLink,
                                      click: () => {
                                        navigator.clipboard.writeText(
                                          window.location.origin +
                                            "/pack/" +
                                            pack.id
                                        );
                                        showToast(
                                          "Link copied to clipboard",
                                          "success"
                                        );
                                      },
                                    },
                                  ],
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </EmptyComponent>
              );
            })}
          </div>
        </Scroll>
      </TabContent>
    </div>
  );
};
