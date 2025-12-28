import {
  Translate,
  Line,
  Field,
  CircleLoading,
  Scroll,
  CardWait,
  Button,
  CircleTip,
} from "@biqpod/app/ui/components";
import { getFieldValue, showToast } from "@biqpod/app/ui/hooks";
import { fuzzySearch, tw } from "@biqpod/app/ui/utils";
import { useState, useEffect, useMemo } from "react";
import { snapbuyApi } from "../../apis";
import { allIcons } from "@biqpod/app/ui/apis";
import { Biqpod } from "@biqpod/app/ui/types";

export const ProductsLimitView = ({
  storeId,
  productsLimit,
  goBack,
}: {
  storeId: string;
  productsLimit: number;
  goBack: Function;
}) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<Biqpod.Snapbuy.Product[]>([]);
  const [brands, setBrands] = useState<Record<string, Biqpod.Snapbuy.Brand>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const searchQuery = getFieldValue("search-product-for-limit");
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const prods = await snapbuyApi.product.getProductsOf(storeId);
        setProducts(prods || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeId]);
  // Fetch brands for products that have brandId
  useEffect(() => {
    const fetchBrands = async () => {
      const brandIds = products
        .map((p) => p.brandId)
        .filter((id): id is string => id !== undefined && id !== null);
      const uniqueBrandIds = [...new Set(brandIds)];
      const brandPromises = uniqueBrandIds.map(async (brandId) => {
        try {
          const brand = await snapbuyApi.brands.get(brandId);
          return { brandId, brand };
        } catch (error) {
          console.error(`Failed to fetch brand ${brandId}:`, error);
          return { brandId, brand: null };
        }
      });
      const brandResults = await Promise.all(brandPromises);
      const brandsMap: Record<string, Biqpod.Snapbuy.Brand> = {};
      brandResults.forEach(({ brandId, brand }) => {
        if (brand) {
          brandsMap[brandId] = brand;
        }
      });
      setBrands(brandsMap);
    };
    if (products.length > 0) {
      fetchBrands();
    }
  }, [products]);
  // Handle Ctrl+A to select all filtered products
  const filteredProducts = useMemo(() => {
    if (!searchQuery?.trim()) return products.filter((product) => product.id);
    // Use fuzzy search on product name and description
    const filtered = products.filter((product) => {
      if (!product.id) return false;
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = fuzzySearch(product.name || "", searchLower);
      const descriptionMatch = fuzzySearch(
        product.description || "",
        searchLower
      );
      const brandMatch =
        product.brandId &&
        fuzzySearch(brands[product.brandId]?.name || "", searchLower);
      return nameMatch || descriptionMatch || brandMatch;
    });
    return filtered;
  }, [products, searchQuery, brands]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        const allIds = filteredProducts.map((p) => p.id!).filter((id) => id);
        setSelectedProducts(allIds);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredProducts]);
  // Highlight matching text in search results
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-[--biqpod-primary] px-0.5 rounded text-[--biqpod-primary-content]"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };
  // Handle product selection with shift support
  const handleProductSelection = (
    productId: string,
    currentIndex: number,
    isShiftClick: boolean
  ) => {
    if (isShiftClick && lastSelectedIndex !== -1) {
      // Shift click - select range
      const startIndex = Math.min(lastSelectedIndex, currentIndex);
      const endIndex = Math.max(lastSelectedIndex, currentIndex);
      const rangeProducts = filteredProducts
        .slice(startIndex, endIndex + 1)
        .map((product) => product.id!)
        .filter((id) => id);
      setSelectedProducts((prev) => {
        const newSelection = new Set([...prev, ...rangeProducts]);
        return Array.from(newSelection);
      });
    } else {
      // Normal click - toggle selection
      setSelectedProducts((prev) => {
        if (prev.includes(productId)) {
          return prev.filter((id) => id !== productId);
        } else {
          return [...prev, productId];
        }
      });
      setLastSelectedIndex(currentIndex);
    }
  };
  const handleDeactivate = async () => {
    if (selectedProducts.length === 0) return;
    try {
      await Promise.all(
        selectedProducts.map(async (id) => {
          const product = products.find((p) => p.id === id);
          if (product) {
            await snapbuyApi.product.upsert(storeId, [
              { ...product, available: false },
            ]);
          }
        })
      );
      showToast(`Deactivated ${selectedProducts.length} products`, "success");
    } catch (error) {
      showToast("Failed to deactivate products", "error");
    }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3">
        <CircleTip
          icon={allIcons.solid.faChevronLeft}
          onClick={() => {
            goBack();
          }}
        />
        <h1 className="text-2xl capitalize">
          <Translate content="select products" />
        </h1>
      </div>
      <Line />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-red-500">
          Your store has {products.length} products, but your plan allows only{" "}
          {productsLimit}. Please select products to deactivate.
        </p>
        {/* Search Field */}
        <div>
          <Field
            placeholder="Search products..."
            inputName="search-product-for-limit"
            className="rounded-2xl"
          />
        </div>
      </div>
      <Line />
      <div className="flex flex-col h-full overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <CircleLoading />
          </div>
        ) : (
          <Scroll>
            <div className="p-3">
              {filteredProducts.map((product, index) => {
                const productId = product.id!;
                const fileImage = product.files?.at(0)?.url || null;
                const isSelected = selectedProducts.includes(productId);
                return (
                  <div
                    key={productId}
                    className={tw(
                      "flex items-center gap-3 hover:bg-[--biqpod-gray-opacity] mb-2 p-2 border border-[--biqpod-borders] border-solid rounded-lg duration-200 cursor-pointer",
                      isSelected && "border-[--biqpod-primary]"
                    )}
                    onClick={(e) => {
                      handleProductSelection(productId, index, e.shiftKey);
                    }}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0 bg-[--biqpod-gray-opacity] rounded-lg w-12 h-12 overflow-hidden">
                      {fileImage ? (
                        <img
                          src={fileImage}
                          alt={product.name || "Product"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center text-[--biqpod-text-color] opacity-50 ${
                          fileImage ? "hidden" : ""
                        }`}
                      >
                        <span className="text-xs">No Image</span>
                      </div>
                    </div>
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[--biqpod-text-color] truncate">
                        {searchQuery?.trim()
                          ? highlightText(
                              product.name || "Unnamed Product",
                              searchQuery
                            )
                          : product.name || "Unnamed Product"}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {product.brandId && brands[product.brandId] && (
                          <span className="bg-[--biqpod-primary] px-2 py-0.5 rounded font-medium text-[--biqpod-primary-content] text-xs">
                            {searchQuery?.trim()
                              ? highlightText(
                                  brands[product.brandId].name ||
                                    product.brandId,
                                  searchQuery
                                )
                              : brands[product.brandId].name || product.brandId}
                          </span>
                        )}
                        {product.brandId && !brands[product.brandId] && (
                          <CardWait className="rounded-2xl w-[140px] h-[25px]" />
                        )}
                        {product.description && (
                          <span className="opacity-70 text-[--biqpod-text-color] truncate">
                            {searchQuery?.trim()
                              ? highlightText(product.description, searchQuery)
                              : product.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Custom Checkbox */}
                    <div className="flex-shrink-0">
                      <label className="inline-flex relative items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedProducts((prev) => [
                                ...prev,
                                productId,
                              ]);
                            } else {
                              setSelectedProducts((prev) =>
                                prev.filter((id) => id !== productId)
                              );
                            }
                            setLastSelectedIndex(index);
                          }}
                          className="sr-only peer"
                        />
                        <div className="flex justify-center items-center peer-checked:bg-[--biqpod-primary] border-[--biqpod-borders] border-2 peer-checked:border-[--biqpod-primary] rounded w-5 h-5 duration-200">
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-[--biqpod-primary-content]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && searchQuery && (
                <div className="opacity-70 py-8 text-[--biqpod-text-color] text-center">
                  No products found matching "{searchQuery}"
                </div>
              )}
            </div>
          </Scroll>
        )}
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        {selectedProducts.length === products.length - productsLimit && (
          <Button onClick={handleDeactivate} className="flex-1">
            Deactivate Selected ({selectedProducts.length})
          </Button>
        )}
      </div>
    </div>
  );
};
