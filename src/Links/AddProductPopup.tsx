import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Field,
  Translate,
  Icon,
  Scroll,
  Button,
  Image,
  NumberField,
  CircleTip,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import {
  getFieldValue,
  useTemp,
  getTemp,
  showToast,
  closePopup,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { include, tw } from "@biqpod/app/ui/utils";
import { useMemo, useState } from "react";
import { BrandInfo } from "./BrandInfo";
import { motion, AnimatePresence } from "framer-motion";
export const AddProductPopup = () => {
  const searchProduct = getFieldValue("search-product");
  const selectedProducts = useTemp<
    Record<string, { count: number; price: number }>
  >("selected-products-for-invoice");
  const productsList = getTemp<Biqpod.Snapbuy.Product[]>("products-list");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [tempCount, setTempCount] = useState<Record<string, number>>({});
  const [tempPrice, setTempPrice] = useState<Record<string, number>>({});
  const filteredProducts = useMemo(() => {
    if (!productsList) return [];
    return productsList.filter((product) =>
      include(`${product.name} ${product.description}`, searchProduct)
    );
  }, [searchProduct, productsList]);
  const handleDone = () => {
    if (Object.keys(selectedProducts.get || {}).length === 0) {
      showToast("please add at least one product", "error");
      return;
    }
    closePopup("add-product-popup");
  };
  const handleQuickAdd = (product: Biqpod.Snapbuy.Product) => {
    if (!product.id) return;
    const count = tempCount[product.id] || 1;
    const price = tempPrice[product.id] || product.single?.customer || 0;
    if (count <= 0 || price <= 0) {
      showToast("please enter valid count and price", "error");
      return;
    }
    selectedProducts.set((prev) => ({
      ...prev,
      [product.id!]: { count, price },
    }));
    setExpandedProduct(null);
    showToast("product added", "success");
  };
  const total = Object.values(selectedProducts.get || {}).reduce(
    (sum, product) => sum + product.count * product.price,
    0
  );
  return (
    <Card className="max-md:w-11/12 md:w-3/4 max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup
        title="add products to invoice"
        popupId="add-product-popup"
      />
      <Line />
      <motion.div
        className="flex p-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Field
          className="shadow-sm border border-[--biqpod-gray-opacity] focus-within:border-[--biqpod-primary] rounded-2xl transition-all duration-300"
          inputName="search-product"
          placeholder="search products"
        />
      </motion.div>
      <Line />
      <Scroll>
        {/* Selected Products Section */}
        {filteredProducts.length === 0 ? (
          <motion.div
            className="py-12 text-[--biqpod-gray-opacity] text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon
                icon={allIcons.solid.faBoxOpen}
                className="opacity-30 text-5xl"
              />
            </motion.div>
            <Translate content="no products found" />
          </motion.div>
        ) : (
          <div>
            <AnimatePresence>
              {filteredProducts.map((product, index) => {
                const prices =
                  product.type === "single"
                    ? [product.single?.customer, product.single?.client]
                    : product.multiple?.prices?.map((p) => p.price) || [];
                const productExists = product.id
                  ? selectedProducts.get?.[product.id]
                  : undefined;
                const isExpanded = expandedProduct === product.id;
                const defaultPrice =
                  product.single?.customer || prices.at(0) || 0;
                return (
                  <div
                    key={product.id}
                    className={tw(
                      `flex flex-col`,
                      isExpanded && "bg-[--biqpod-primary-background]"
                    )}
                  >
                    {!!index && <Line />}
                    <div className="flex justify-between items-center p-2">
                      <div className="flex flex-1 items-center gap-4">
                        <motion.div
                          className="group relative"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Image
                            src={product.files?.at(0)?.url}
                            alt={
                              <Icon
                                icon={allIcons.solid.faBoxOpen}
                                className="text-[--biqpod-gray-opacity-2] text-3xl"
                              />
                            }
                            className="bg-[--biqpod-gray-opacity] rounded-xl w-16 h-16"
                          />
                          {productExists && (
                            <motion.div
                              className="-top-2 -right-2 absolute flex justify-center items-center bg-[--biqpod-success] rounded-full w-6 h-6 font-bold text-white text-xs"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 15,
                              }}
                            >
                              ✓
                            </motion.div>
                          )}
                        </motion.div>
                        <div className="flex flex-col flex-1 gap-1 min-w-0">
                          <div className="font-semibold text-lg truncate">
                            {product.name}
                            <sub className="text-[--biqpod-gray-opacity-2] ml-2 text-xs">
                              <BrandInfo brandId={product.brandId} />
                            </sub>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {prices.filter(Boolean).map((price, idx) => {
                              return (
                                <motion.div
                                  key={price}
                                  className="inline-flex items-center gap-1 bg-green-500/15 px-3 py-1 rounded-full font-medium text-xs"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.1 }}
                                  whileHover={{ scale: 1.1 }}
                                >
                                  <Icon
                                    icon={allIcons.solid.faTag}
                                    className="text-xs"
                                  />
                                  {price?.toLocaleString("fr-DZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                  DA
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!!productExists ? (
                          <motion.div
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <div className="text-right">
                              <motion.div
                                className="font-bold text-[--biqpod-success] text-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 200,
                                }}
                              >
                                {productExists?.price.toLocaleString("fr-DZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                                DA
                              </motion.div>
                              <div className="text-[--biqpod-gray-opacity-2] text-xs">
                                Qty: {productExists.count}
                              </div>
                            </div>
                            <motion.div
                              className="inline-flex justify-center items-center bg-[--biqpod-success] rounded-full w-6 h-6 font-bold text-white"
                              animate={{
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                repeatDelay: 2,
                              }}
                            >
                              {productExists.count}
                            </motion.div>
                          </motion.div>
                        ) : (
                          <motion.div
                            whileHover={{
                              scale: 1.1,
                              rotate: isExpanded ? 0 : 90,
                            }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <CircleTip
                              icon={
                                isExpanded
                                  ? allIcons.solid.faTimes
                                  : allIcons.solid.faPlus
                              }
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedProduct(null);
                                } else {
                                  setExpandedProduct(product.id || null);
                                  if (product.id) {
                                    setTempCount((prev) => ({
                                      ...prev,
                                      [product.id!]: 1,
                                    }));
                                    setTempPrice((prev) => ({
                                      ...prev,
                                      [product.id!]: defaultPrice,
                                    }));
                                  }
                                }
                              }}
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <EmptyComponent>
                          <Line />
                          <motion.div
                            className="flex flex-col gap-3 p-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <motion.div
                              className="flex max-md:flex-col md:items-center gap-3"
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              <label className="flex md:justify-end items-center gap-2 w-full md:w-24 font-medium text-sm">
                                <Icon
                                  icon={allIcons.solid.faHashtag}
                                  className="text-[--biqpod-primary]"
                                />
                                <Translate content="count" /> :
                              </label>
                              <NumberField
                                config={{
                                  placeholder: "1",
                                  autoChange: true,
                                }}
                                state={{
                                  get: tempCount[product.id!] || 1,
                                  set: (value) => {
                                    if (
                                      product.id &&
                                      typeof value === "number"
                                    ) {
                                      setTempCount((prev) => ({
                                        ...prev,
                                        [product.id!]: value,
                                      }));
                                    }
                                  },
                                }}
                              />
                            </motion.div>
                            <motion.div
                              className="flex max-md:flex-col md:items-center gap-3"
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <label className="flex md:justify-end items-center gap-2 w-full md:w-24 font-medium text-sm">
                                <Icon
                                  icon={allIcons.solid.faDollarSign}
                                  className="text-[--biqpod-primary]"
                                />
                                <Translate content="price" /> :
                              </label>
                              <NumberField
                                config={{
                                  placeholder: defaultPrice.toString(),
                                  autoChange: true,
                                }}
                                state={{
                                  get: tempPrice[product.id!] || defaultPrice,
                                  set: (value) => {
                                    if (product.id) {
                                      setTempPrice((prev) => ({
                                        ...prev,
                                        [product.id!]: value as number,
                                      }));
                                    }
                                  },
                                }}
                              />
                            </motion.div>
                          </motion.div>
                          <Line />
                          <motion.div
                            className="flex justify-between items-center p-2"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[--biqpod-gray-opacity-2] text-sm">
                                Total:
                              </span>
                              <motion.span
                                className="font-bold text-[--biqpod-success] text-xl"
                                key={`${tempCount[product.id!]}-${
                                  tempPrice[product.id!]
                                }`}
                                initial={{ x: -1.2 }}
                                animate={{ x: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                }}
                              >
                                {(
                                  (tempCount[product.id!] || 1) *
                                  (tempPrice[product.id!] || defaultPrice)
                                ).toLocaleString("fr-DZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                DA
                              </motion.span>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => handleQuickAdd(product)}
                                icon={allIcons.solid.faCheck}
                                className="shadow-md rounded-xl w-fit"
                              >
                                <Translate content="add" />
                              </Button>
                            </motion.div>
                          </motion.div>
                        </EmptyComponent>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Scroll>
      <Line />
      <motion.div
        className="p-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <Icon
                icon={allIcons.solid.faShoppingCart}
                className="text-[--biqpod-success]"
              />
            </motion.div>
            <span className="text-[--biqpod-gray-opacity-2] font-medium">
              Selected Total:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              className="font-bold text-[--biqpod-success] text-2xl"
              key={total}
              initial={{ scale: 1.3, color: "#10b981" }}
              animate={{ scale: 1, color: "var(--biqpod-success)" }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {total.toLocaleString("fr-DZ", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              DA
            </motion.span>
          </div>
        </div>
        {Object.keys(selectedProducts.get || {}).length > 0 && (
          <motion.div
            className="text-[--biqpod-gray-opacity-2] text-xs text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Object.keys(selectedProducts.get || {}).length} product(s) selected
          </motion.div>
        )}
      </motion.div>
      <Line />
      <motion.div
        className="flex gap-3 p-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={() => closePopup("add-product-popup")}
          className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={handleDone}
          disabled={Object.keys(selectedProducts.get || {}).length === 0}
          rightIcon={allIcons.solid.faCheck}
          className="rounded-full"
        >
          <Translate content="create" /> (
          {Object.keys(selectedProducts.get || {}).length})
        </Button>
      </motion.div>
    </Card>
  );
};
