import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  Translate,
  CircleTip,
  Field,
  Scroll,
  Line,
  CircleLoading,
  Button,
  Image,
} from "@biqpod/app/ui/components";
import {
  getFieldValue,
  showToast,
  useAction,
  closePopup,
  execAction,
  isLoading,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { filterFuzzySearch, tw } from "@biqpod/app/ui/utils";
import { useState, useEffect, useMemo } from "react";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
export const SetBrandPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  const [brands, setBrands] = useState<Biqpod.Snapbuy.Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const searchTerm = getFieldValue("set-brand-search");
  useEffect(() => {
    const fetchBrands = async () => {
      if (!storeId) return;
      setLoadingBrands(true);
      try {
        const fetchedBrands = await snapbuyApi.brands.getAll(storeId);
        setBrands(fetchedBrands || []);
      } catch (error) {
        console.error("Failed to load brands:", error);
        showToast("Failed to load brands", "error");
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, [storeId]);
  const filteredBrands = useMemo(() => {
    if (!searchTerm?.trim()) return brands;
    const nameMatches = filterFuzzySearch(brands, searchTerm, "name");
    const descMatches = filterFuzzySearch(brands, searchTerm, "description");
    return [...new Set([...nameMatches, ...descMatches])];
  }, [brands, searchTerm]);
  const action = useAction(
    "set-brand",
    async () => {
      if (!selectedBrandId) {
        showToast("Please select a brand", "error");
        return;
      }
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.product.get(productId);
          if (product) {
            const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
              id: productId,
              brandId: selectedBrandId,
            };
            await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      const brandName =
        brands.find((b) => b.id === selectedBrandId)?.name || selectedBrandId;
      showToast(
        `Brand "${brandName}" set to ${selectedProducts.length} products successfully`,
        "success"
      );
      onSuccess();
      closePopup();
      execAction("fetch-products");
    },
    [selectedProducts, storeId, selectedBrandId, brands]
  );
  const loading = isLoading(action);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="set brand to products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="p-2">
        <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
          <p className="text-sm">
            <Translate content="select a brand to assign to the selected products" />
          </p>
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Field
          inputName="set-brand-search"
          placeholder="Search brands..."
          className="rounded-xl"
        />
      </div>
      <Line />
      <Scroll className="flex-1 overflow-hidden">
        {loadingBrands ? (
          <div className="flex justify-center items-center py-8">
            <CircleLoading />
            <span className="ml-2">
              <Translate content="loading brands..." />
            </span>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <span className="text-[--biqpod-gray-opacity-2]">
              {searchTerm?.trim()
                ? "No brands match your search"
                : "No brands found"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-2">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className={tw(
                  "flex items-center gap-2 p-2 rounded-lg cursor-pointer border",
                  selectedBrandId === brand.id
                    ? "bg-[--biqpod-primary] text-[--biqpod-primary-content] border-[--biqpod-primary]"
                    : "hover:bg-[--biqpod-gray-opacity] border-[--biqpod-borders]"
                )}
                onClick={() => setSelectedBrandId(brand.id!)}
              >
                <Image
                  src={brand.photo}
                  alt={brand.name}
                  className="bg-[--biqpod-gray-opacity] w-[40px] h-[40px]"
                />
                <div className="flex flex-col">
                  <span className="font-semibold">{brand.name}</span>
                  {brand.description && (
                    <span className="opacity-75 text-sm">
                      {brand.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Scroll>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => {
            closePopup();
          }}
          className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={async () => {
            execAction("set-brand");
          }}
          disabled={loading || !selectedBrandId || loadingBrands}
          rightIcon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faCheck
          }
          className="flex-1"
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="set brand" />
        </Button>
      </div>
    </Card>
  );
};
