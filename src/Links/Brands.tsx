import * as React from "react";
import {
  Button,
  Card,
  CardWait,
  CircleTip,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useStoreId } from "../utils";
import { snapbuyApi } from "../apis";
import {
  confirm,
  execAction,
  openMenu,
  showPopup,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { UpsertBrand } from "./UpsertBrand";
import { allIcons } from "@biqpod/app/ui/apis";
import notFounPhoto from "../assets/page-not-found.png";
import { useActionStatus } from "../routes/Clients/CartPopup";
import { delay, range, tw } from "@biqpod/app/ui/utils";
import { useEffect } from "react";
export const Brands = () => {
  const storeId = useStoreId();

  const brands = useCopyState<SnapBuy.Brand[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const action = useAction(
    "fetch-brands",
    async () => {
      if (!storeId) return null;
      await delay(1000);
      const result = await snapbuyApi.getAllBrands(storeId);
      brands.set(result);
    },
    [storeId]
  );

  const { isLoading, isSuccess } = useActionStatus(action);

  useEffect(() => {
    execAction("fetch-brands");
  }, []);

  const filteredBrands = brands.get.filter((brand) =>
    brand.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-2">
        <input
          type="text"
          placeholder="Search for a brand..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-[--biqpod-borders] rounded-md"
        />
      </div>
      {isSuccess && !!filteredBrands.length && (
        <Scroll>
          {filteredBrands.map((brand) => {
            return (
              <div
                key={brand.id}
                className="flex justify-between items-center gap-2 hover:bg-[--biqpod-primary-background] p-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    {brand.photo ? (
                      <img
                        src={brand.photo}
                        className="border border-[--biqpod-borders] border-solid rounded-xl w-16 h-16 object-cover"
                        alt={brand.name}
                      />
                    ) : (
                      <div className="flex justify-center items-center bg-[--biqpod-gray-opacity] border border-[--biqpod-borders] border-solid rounded-xl w-16 h-16">
                        <span className="font-bold text-[--biqpod-text-color] text-xs">
                          {brand.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{brand.name}</span>
                    {brand.description && (
                      <span className="max-w-[200px] text-[--biqpod-gray-opacity] text-sm truncate">
                        {brand.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <CircleTip
                      onClick={(e) => {
                        e.stopPropagation();
                        openMenu({
                          x: e.clientX,
                          y: e.clientY,
                          menu: [
                            {
                              label: "Edit",
                              click: () => {
                                showPopup(<UpsertBrand back brand={brand} />);
                              },
                              defaultIcon: allIcons.solid.faPen,
                            },
                            {
                              type: "separator",
                            },
                            {
                              label: "Delete",
                              click: async () => {
                                const response = await confirm({
                                  title: "Delete Brand",
                                  message: `Are you sure you want to delete the brand \"${brand.name}\"? This action cannot be undone.`, 
                                });
                                if (!response) return;
                                await snapbuyApi.deleteBrand(brand.id!); 
                                showToast(
                                  "Brand deleted successfully",
                                  "success"
                                );
                              },
                              defaultIcon: allIcons.solid.faTrash,
                            },
                          ],
                        });
                      }}
                      icon={allIcons.solid.faEllipsisVertical}
                    />
                  </div>
                  <div>
                    <CircleTip
                      onClick={() => {
                        showPopup(<UpsertBrand back brand={brand} />);
                      }}
                      icon={allIcons.solid.faChevronRight}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </Scroll>
      )}
      {isSuccess && !filteredBrands.length && (
        <div className="flex justify-center items-center h-full">
          <Card>
            <div className="flex justify-center items-center">
              <img src={notFounPhoto} alt="" />
            </div>
            <Line />
            <div className="p-2">
              <Translate content="No brands found. You can create a new brand by clicking the button below." />
            </div>
          </Card>
        </div>
      )}
      {isLoading && (
        <Scroll>
          <div className="flex flex-col gap-2 p-1">
            {range(20).map((index) => {
              return (
                <CardWait
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-2xl h-[80px]"
                >
                  <CardWait className="rounded-full w-[60px] h-[60px]" />
                  <CardWait
                    className={tw(
                      "h-[20px] rounded-full",
                      index % 2 === 0 ? "w-[200px]" : "w-[150px]"
                    )}
                  />
                </CardWait>
              );
            })}
          </div>
        </Scroll>
      )}
      <Line />
      <div className="p-2">
        <Button
          icon={allIcons.solid.faPlus}
          onClick={() => {
            showPopup(<UpsertBrand back />);
          }}
          className="rounded-full"
        >
          <Translate content="create brand" />
        </Button>
      </div>
    </div>
  );
};