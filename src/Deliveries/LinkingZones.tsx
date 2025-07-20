import {
  Card,
  CardHeaderForPopup,
  Line,
  NumberField,
  Button,
  Translate,
  EmptyComponent,
  Tip,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  showToast,
  closePopup,
  setTemp,
  useAsyncMemo,
  confirm,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useEffect } from "react";
import { allIcons, and, getDocs, or, where } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";

interface LinkingZonesProps {
  first: string;
  second: string;
}
export const LinkingZones = ({ first, second }: LinkingZonesProps) => {
  const priceState = useCopyState<number | undefined | null>(null);
  const link = useAsyncMemo(async () => {
    const record = await getDocs<SnapBuy.LinkZone>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "zone-links"],
      {
        where: or(
          and(where("first", "==", first), where("second", "==", second)),
          and(where("first", "==", second), where("second", "==", first))
        ),
        limit: 1,
      }
    );
    return record?.at(0)?.data;
  }, []);
  useEffect(() => {
    if (link) {
      priceState.set(link.price);
    } else {
      priceState.set(null);
    }
  }, [link]);
  return (
    <Card>
      <CardHeaderForPopup title="link zones" />
      <Line />
      <div className="p-3">
        <NumberField
          id="linking-zones-price"
          state={priceState}
          config={{
            autoChange: true,
            placeholder: "Enter Price",
            center: true,
            size: 20,
          }}
        />
      </div>
      <AnimatePresence initial={false}>
        {link && (
          <motion.div
            key="exists-tip"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <EmptyComponent>
              <Card className="m-2 p-3">
                <div className="flex items-center gap-2">
                  <Tip icon={allIcons.solid.faCheck} />
                  <p>
                    <Translate content="this link already exists" />
                  </p>
                </div>
              </Card>
              <Line />
            </EmptyComponent>
          </motion.div>
        )}
      </AnimatePresence>
      <Line />
      <div className="p-2">
        <Button
          className="rounded-full"
          onClick={async () => {
            if (typeof priceState.get === "number") {
              const response = await confirm({
                title: "Confirm Link",
                message: "Are you sure you want to link these zones?",
                detail: `Linking ${first} and ${second} with a price of ${priceState.get}`,
              });
              if (response) {
                await snapbuyApi.linkZone(first, second, priceState.get);
                setTemp("mode-select-zones", false);
                closePopup();
              }
            } else {
              showToast("Please enter a valid price", "error");
            }
          }}
          rightIcon={allIcons.solid.faChevronRight}
        >
          <Translate content="link" />
        </Button>
      </div>
    </Card>
  );
};
