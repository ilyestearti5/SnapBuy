import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  Translate,
  CircleTip,
  Scroll,
  Line,
} from "@biqpod/app/ui/components";
import {
  showToast,
  openPath,
  closePopup,
  showPopup,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { ExportExcelPopupProducts } from "./ExportExcelPopupProducts";
import { ExportJsonPopup } from "./ExportJsonPopup";
import { loadFromExcel } from "./loadFromExcel";
import { PLATFORM_LOGOS } from "./PLATFORM_LOGOS";
import { Icon } from "@biqpod/app/ui/shared";

interface ImportExportMethod {
  name: string;
  logo: string;
  onClick: () => void;
  comingSoon?: boolean;
}
interface ImportExportPopupProps {
  mode: "import" | "export";
}
export const ImportExportPopup = ({ mode }: ImportExportPopupProps) => {
  const storeId = useStoreId();
  const bigMerchants: ImportExportMethod[] = [
    {
      name: "WooCommerce",
      logo: PLATFORM_LOGOS.woocommerce,
      onClick: () => {
        showToast("WooCommerce integration coming soon!", "info");
      },
    },
    {
      name: "Shopify",
      logo: PLATFORM_LOGOS.shopify,
      onClick: () => {
        showToast("Shopify integration coming soon!", "info");
      },
    },
    {
      name: "WordPress",
      logo: PLATFORM_LOGOS.wordpress,
      onClick: () => {
        showToast("WordPress integration coming soon!", "info");
      },
    },
    {
      name: "BigCommerce",
      logo: PLATFORM_LOGOS.bigcommerce,
      onClick: () => {
        showToast("BigCommerce integration coming soon!", "info");
      },
    },
    {
      name: "Magento",
      logo: PLATFORM_LOGOS.magento,
      onClick: () => {
        showToast("Magento integration coming soon!", "info");
      },
    },
  ];
  const fileSystems: ImportExportMethod[] =
    mode === "import"
      ? [
          {
            name: "JSON",
            logo: PLATFORM_LOGOS.json,
            onClick: async () => {
              const files = await openPath({
                filters: [
                  {
                    name: "*",
                    extensions: ["json"],
                  },
                ],
              });
              const file = files.at(0);
              if (!file) {
                showToast("Please select a file");
                return;
              }
              const text = await (file as unknown as File).text();
              const data = JSON.parse(text);
              if (data.products && Array.isArray(data.products)) {
                await snapbuyApi.product.upsert(
                  storeId!,
                  data.products.map((p: Partial<Biqpod.Snapbuy.Product>) => p)
                );
              }
              if (data.brands && Array.isArray(data.brands)) {
                for (const brand of data.brands) {
                  await snapbuyApi.brands.upsert({ ...brand, storeId });
                }
              }
              if (data.packs && Array.isArray(data.packs)) {
                for (const pack of data.packs) {
                  await snapbuyApi.packs.add({ ...pack, storeId });
                }
              }
              if (data.collections && Array.isArray(data.collections)) {
                for (const collection of data.collections) {
                  await snapbuyApi.collections.upsert({
                    ...collection,
                    storeId,
                  });
                }
              }
              if (data.coupons && Array.isArray(data.coupons)) {
                for (const coupon of data.coupons) {
                  await snapbuyApi.coupon.upsert({ ...coupon, storeId });
                }
              }
              showToast("Import completed successfully");
              closePopup();
            },
          },
          {
            name: "Excel",
            logo: PLATFORM_LOGOS.excel,
            onClick: async () => {
              const files = await openPath({
                filters: [
                  {
                    name: "*",
                    extensions: ["xlsx", "xls", "csv"],
                  },
                ],
              });
              const file = files.at(0);
              if (!file) {
                showToast("Please select a file");
                return;
              }
              loadFromExcel(file);
              closePopup();
            },
          },
        ]
      : [
          {
            name: "JSON",
            logo: PLATFORM_LOGOS.json,
            onClick: () => {
              closePopup();
              showPopup(<ExportJsonPopup />);
            },
          },
          {
            name: "Excel",
            logo: PLATFORM_LOGOS.excel,
            onClick: () => {
              closePopup();
              showPopup(<ExportExcelPopupProducts />);
            },
          },
        ];
  const renderMethodCard = (method: ImportExportMethod) => (
    <motion.div
      key={method.name}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={method.onClick}
      className={tw(
        "relative flex flex-col items-center gap-3 bg-[--biqpod-primary-background] hover:bg-[--biqpod-gray-opacity] border p-4 rounded-2xl cursor-pointer border-solid border-[--biqpod-borders] duration-200",
        method.comingSoon && "opacity-60"
      )}
    >
      {method.comingSoon && (
        <div className="top-2 right-2 absolute bg-yellow-500 px-2 py-1 rounded-full font-semibold text-white text-xs">
          Soon
        </div>
      )}
      <div className="flex justify-center items-center bg-white rounded-xl w-full h-20 overflow-hidden">
        <img
          src={method.logo}
          alt={method.name}
          className="p-2 w-full h-full object-contain"
          draggable={false}
        />
      </div>
      <span className="font-semibold text-sm text-center capitalize">
        {method.name}
      </span>
    </motion.div>
  );
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-3/4 lg:w-2/3 max-md:h-full md:max-h-[85vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate
            content={mode === "import" ? "import products" : "export products"}
          />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <Scroll className="flex flex-col gap-6 p-4 h-full">
        {/* Big Merchants Section */}
        <div>
          <h2 className="mb-4 font-semibold text-xl capitalize">
            <Icon icon={allIcons.solid.faStore} className="mr-2" />
            <Translate content="big merchants" />
          </h2>
          <div className="gap-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {bigMerchants.map(renderMethodCard)}
          </div>
        </div>
        {/* File Systems Section */}
        <div>
          <h2 className="mb-4 font-semibold text-xl capitalize">
            <Icon icon={allIcons.solid.faFile} className="mr-2" />
            <Translate content="file systems" />
          </h2>
          <div className="gap-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {fileSystems.map(renderMethodCard)}
          </div>
        </div>
      </Scroll>
    </Card>
  );
};
