import { allIcons, and, where } from "biqpod/ui/apis";
import { include, mergeObject, tw } from "biqpod/ui/utils";
import {
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  ExcelPopup,
  Field,
  Icon,
  Line,
  Mouseable,
  MultiScreenPage,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import {
  execAction,
  getFieldValue,
  getPosition,
  getTemp,
  isLoading,
  isSuccess,
  openMenu,
  openPath,
  positionsHooks,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useTemp,
  useUser,
} from "biqpod/ui/hooks";
import { useEffect, useMemo } from "react";
import { getDocs } from "../server";
import { UpsertProduct } from "./AddProduct";
import { api, useCategorys, useFocused, useMarkets } from "../apis";
import { Biqpod } from "biqpod/ui/types";
import { PopupProduct } from "./PopupProduct";
import { PopupFilter } from "./PopupFilter";
import { fuzzyRankedSearch } from "../utils";
interface ProductRenderProps {
  product: SnapBuy.Product;
}
const ProductRender = ({ product }: ProductRenderProps) => {
  const isFullWidth = getTemp<boolean>("isFullWidth");
  const changePosition = useCopyState<Partial<Biqpod.Types.Axis>>({});
  const isStartChange = useMemo(() => {
    return (
      typeof changePosition.get.x == "number" &&
      typeof changePosition.get.y == "number"
    );
  }, [changePosition.get]);
  useEffect(() => {
    setTemp("canDeleteProduct", isStartChange ? product.id : null);
  }, [isStartChange]);
  const focused = useCopyState(0);
  const photos = product.photos || [];
  return (
    <Mouseable
      // onMoving={changePosition.set}
      onMovingEnd={() => {
        // changePosition.set({});
      }}
      style={{
        ...mergeObject(
          isStartChange && {
            left: changePosition.get.x,
            top: changePosition.get.y,
          }
        ),
      }}
      className={tw(
        isStartChange && "fixed",
        "w-[calc(50%-4px)]",
        isFullWidth && "w-full"
      )}
    >
      <Card key={product.id} className="w-full overflow-hidden">
        <div className="relative flex justify-center items-center w-full h-[200px] cursor-pointer">
          <MultiScreenPage
            pages={photos.map((photo) => {
              return (
                <div className="relative flex justify-center items-center h-full overflow-hidden cursor-pointer">
                  <img
                    draggable="false"
                    src={photo}
                    className="absolute inset-0 opacity-20 blur-lg object-cover"
                  />
                  <img
                    draggable="false"
                    src={photo}
                    className="w-full h-full object-contain"
                  />
                </div>
              );
            })}
            focused={focused.get}
          />
          {photos.length > 1 && (
            <EmptyComponent>
              <div className="top-1/2 left-2 absolute -translate-y-1/2 transform">
                <CircleTip
                  icon={allIcons.solid.faChevronLeft}
                  onClick={() => {
                    if (focused.get <= 0) {
                      focused.set(photos.length - 1);
                      return;
                    }
                    focused.set(focused.get - 1);
                  }}
                />
              </div>
              <div className="top-1/2 right-2 absolute -translate-y-1/2 transform">
                <CircleTip
                  icon={allIcons.solid.faChevronRight}
                  onClick={() => {
                    if (focused.get >= photos.length - 1) {
                      focused.set(0);
                      return;
                    }
                    focused.set(focused.get + 1);
                  }}
                />
              </div>
              <div className="bottom-2 left-1/2 absolute text-black -translate-x-1/2 transform">
                {focused.get + 1} / {photos.length}
              </div>
            </EmptyComponent>
          )}
          {photos.length == 0 && (
            <Icon
              iconClassName="text-8xl text-[--biqpod-gray-opacity]"
              icon={allIcons.solid.faBoxOpen}
            />
          )}
          {!!product.available && (
            <div className="top-0 right-0 absolute bg-[--biqpod-primary] px-3 py-1 rounded-es-2xl text-[--biqpod-primary-content] capitalize">
              <Translate content="available" />
            </div>
          )}
        </div>
        <Line />
        <div className="p-2 max-md:p-1">{product.name}</div>
        <Line />
        <div className="flex justify-between items-center px-2 max-md:py-1 md:py-2">
          <span className="font-bold text-[--biqpod-success]">
            {product.price} DA
          </span>
          <CircleTip
            icon={allIcons.solid.faEllipsisVertical}
            onClick={({ clientX, clientY }) => {
              openMenu({
                x: clientX,
                y: clientY,
                menu: [
                  {
                    label: "Copy Name",
                    click: async () => {
                      await navigator.clipboard.writeText(product.name);
                      showToast("Name Copyed :)");
                    },
                  },
                  {
                    label: "Copy Price",
                    click: async () => {
                      await navigator.clipboard.writeText(
                        product.price.toString()
                      );
                      showToast("Price Copyed :)");
                    },
                  },
                  {
                    label: "Copy Category",
                    click: async () => {
                      await navigator.clipboard.writeText(
                        product.category || ""
                      );
                      showToast("Category Copyed :)");
                    },
                  },
                  {
                    label: "Copy Market",
                    click: async () => {
                      await navigator.clipboard.writeText(product.market || "");
                      showToast("Market Copyed :)");
                    },
                  },
                  {
                    label: "Copy Description",
                    click: async () => {
                      await navigator.clipboard.writeText(
                        product.description || ""
                      );
                      showToast("Description Copyed :)");
                    },
                  },
                  {
                    type: "separator",
                  },
                  {
                    label: "Edit Product",
                    click: () => {
                      showPopup(<UpsertProduct product={product} />);
                    },
                    defaultIcon: allIcons.solid.faPenToSquare,
                  },
                  {
                    label: "Delete Product",
                    click: async () => {
                      await api.deleteProduct(product.id);
                      execAction("get-products");
                      showToast("Product Deleted");
                    },
                    defaultIcon: allIcons.solid.faTrashCan,
                  },
                ],
              });
            }}
          />
        </div>
      </Card>
    </Mouseable>
  );
};
export const Products = () => {
  const user = useUser();
  const products = useCopyState<SnapBuy.Product[]>([]); // Replace with your actual product data
  const productsRecived = getTemp<boolean>("productsRecived");
  const productsList = getTemp<SnapBuy.Product[]>("productsList");
  const action = useAction(
    "get-products",
    async () => {
      if (!user?.uid) return;
      if (!productsRecived && productsList) {
        products.set(productsList);
        return;
      }
      const snapshot = await getDocs<SnapBuy.Product>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
        {
          where: and(where("uid", "==", user.uid)),
        }
      );
      const productsData = snapshot?.map((doc) => ({
        ...doc.data,
        id: doc.id,
      }));
      setTemp("productsList", productsData);
      setTemp("productsRecived", true);
      productsData && products.set(productsData);
    },
    [user, productsRecived]
  );
  const success = isSuccess(action);
  useEffect(() => {
    execAction("get-products");
  }, [user]);
  const isFullWidth = useTemp("isFullWidth");
  const showTools = useCopyState(false);
  // categorys
  const positionCategory = getPosition("prod-category-layout");
  const typesCategory = getFieldValue("prod-category");
  const categorys = useCategorys();
  // market
  const typedMarket = getFieldValue("prod-category");
  const positionMark = getPosition("prod-market-layout");
  const markets = useMarkets();
  // filtring
  const filterdMarkets = useMemo(() => {
    if (!markets) return [];
    const filteredMarkets = markets.filter((market) => {
      return include(market, typedMarket);
    });
    return filteredMarkets;
  }, [typedMarket, markets]);
  const search = getFieldValue("producer-search-product");
  const filterdCategorys = useMemo(() => {
    if (!categorys) return [];
    const filteredCategorys = categorys.filter((category) => {
      return include(category, typesCategory);
    });
    return filteredCategorys;
  }, [typesCategory, categorys]);
  const filterProducts = useMemo(() => {
    if (!search) {
      return products.get;
    }
    return fuzzyRankedSearch(search, products.get, "name");
  }, [search, products.get]);
  useEffect(() => {
    if (user?.uid) return api.onCategoryAndMarketChange(user?.uid);
  }, [user]);
  const focused = useFocused();
  const canDelete = getTemp<string>("canDeleteProduct");
  const loading = isLoading(action);
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div>
          <Field
            inputName="producer-search-product"
            placeholder="Search Product"
            className="rounded-xl"
          />
        </div>
        <div className="flex">
          <CircleTip
            icon={allIcons.solid.faFilter}
            onClick={() => {
              showPopup(<PopupFilter />);
            }}
          />
          <CircleTip
            icon={
              isFullWidth.get
                ? allIcons.solid.faCompress
                : allIcons.solid.faExpand
            }
            onClick={() => {
              isFullWidth.set(!isFullWidth.get);
            }}
          />
        </div>
      </div>
      <Line />
      {success && (
        <Scroll>
          <div className="flex flex-wrap items-center gap-2 p-2">
            {filterProducts.map((product) => {
              return <ProductRender product={product} key={product.id} />;
            })}
            {filterProducts.length === 0 && (
              <div className="flex justify-center items-center w-full h-full">
                <Card>
                  <div className="flex justify-center items-center p-2 h-full">
                    <Icon
                      icon={allIcons.solid.faBoxOpen}
                      iconClassName="text-8xl text-[--biqpod-primary]"
                    />
                  </div>
                  <Line />
                  <div className="flex justify-center items-center p-2 h-full">
                    <Translate content="no products found" />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Scroll>
      )}
      {loading && <CardWait className="w-full h-full" />}
      <Card
        onClick={() => {
          showTools.set(!showTools.get);
        }}
        className="right-4 bottom-4 z-[5000000000000000000000000000000] absolute flex flex-col items-center p-3 rounded-3xl"
      >
        <CircleTip
          icon={allIcons.regular.faFileExcel}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            const files = await openPath({});
            const file = files.at(0);
            if (!file) {
              showToast("Please select a file");
              return;
            }
            showPopup(
              <ExcelPopup
                uri={file!}
                options={[
                  "id",
                  "name",
                  "price",
                  "photo",
                  "description",
                  "category",
                  "available",
                  "market",
                ]}
                onChange={(json) => {
                  showPopup(<PopupProduct products={json} file={file} />);
                }}
                title="Excel File"
              />
            );
          }}
        />
        <CircleTip
          icon={allIcons.solid.faPlus}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<UpsertProduct />);
          }}
        />
        <CircleTip
          icon={allIcons.solid.faPlus}
          iconClassName={tw(
            "transition-transform",
            showTools.get ? "rotate-45" : "rotate-0"
          )}
        />
      </Card>
      {positionMark && focused == "prod-market" && typedMarket && (
        <Card
          className="z-[5000000000000000000000000000000] fixed"
          style={{
            ...mergeObject(
              positionMark.x && { left: positionMark.x },
              positionMark.y &&
                positionMark.height && {
                  top: positionMark.y + positionMark.height,
                }
            ),
          }}
        >
          {filterdMarkets?.map((mrk) => {
            return (
              <div key={mrk} className="uppercase">
                {mrk}
              </div>
            );
          })}
        </Card>
      )}
      <div
        className={tw(
          "bottom-0 z-[10000] absolute inset-x-0 flex justify-center items-center bg-gradient-to-t to-[--biqpod-transparent] opacity-0 from-[--biqpod-shadow-color] p-2 transition-[transform,opacity] translate-y-full duration-500 pointer-events-none transform",
          canDelete && "pointer-events-auto opacity-100 translate-y-0"
        )}
      >
        <div className="flex justify-center items-center bg-[--biqpod-primary-background] border border-[--biqpod-error] border-solid rounded-full w-[80px] h-[80px]">
          <Icon
            icon={allIcons.solid.faTrashCan}
            iconClassName="text-[--biqpod-error] text-3xl"
          />
        </div>
      </div>
    </div>
  );
};
