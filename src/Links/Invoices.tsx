import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  execAction,
  getFieldValue,
  isLoading,
  showPopup,
  useAsyncEffect,
  useDeviceResolution,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { include } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { useStoreId } from "../utils";
import { motion } from "framer-motion";
import { AnimatedList, AnimatedListItem, ScaleIn } from "../animations";
import { useUsedBy } from "../routes/Stores/Stores";
import { Biqpod } from "@biqpod/app/ui/types";
import { CreateInvoicePopup } from "./CreateInvoicePopup";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
const NoInvoicesFound = ({ usedBy }: { usedBy: string | null }) => {
  return (
    <motion.div className="flex justify-center items-center h-full min-h-[400px]">
      <ScaleIn delay={0.2}>
        <Card className="relative mx-auto max-w-md overflow-hidden text-center">
          <div className="z-10 relative">
            <motion.div
              className="p-5"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon
                  icon={allIcons.solid.faFileInvoice}
                  className="text-[--biqpod-gray-opacity] text-8xl"
                />
              </motion.div>
            </motion.div>
            <Line />
            <motion.div
              className="flex flex-col gap-2 p-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.h3
                className="font-semibold text-[--biqpod-text-color] text-xl uppercase"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  background:
                    "linear-gradient(90deg, var(--biqpod-text-color), var(--biqpod-primary), var(--biqpod-text-color))",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                <Translate content="no invoices found" />
              </motion.h3>
              <motion.p
                className="text-[--biqpod-gray-opacity-2]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Translate content="there are no invoices matching your criteria" />
              </motion.p>
            </motion.div>
            <Line />
            <motion.div
              className="p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              {(usedBy === "owned" || usedBy === "read/edit") && (
                <Button
                  className="rounded-full"
                  icon={allIcons.solid.faPlus}
                  onClick={() => showPopup(<CreateInvoicePopup />)}
                >
                  <Translate content="create invoice" />
                </Button>
              )}
            </motion.div>
          </div>
        </Card>
      </ScaleIn>
    </motion.div>
  );
};
export const Invoices = () => {
  const searchInvoice = getFieldValue("search-invoice");
  const invoices = useTemp<Biqpod.Snapbuy.Invoice[]>("invoices-list");
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  useAsyncEffect(async () => {
    execAction("fetch-invoices", {});
  }, [storeId]);
  const filteredInvoices = useMemo(() => {
    if (!invoices.get) return [];
    return invoices.get.filter((invoice) =>
      include(
        `${invoice.id} ${invoice.customerName} ${invoice.status}`,
        searchInvoice
      )
    );
  }, [searchInvoice, invoices.get]);
  const { isMobile, isTablet } = useDeviceResolution();
  const isSmallView = isMobile || isTablet;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-2">
        <Field
          inputName="search-invoice"
          placeholder="search invoices"
          className="flex-1 rounded-xl"
        />
      </div>
      <Line />
      {!isSmallView && (
        <EmptyComponent>
          <div className="flex justify-between items-center gap-2 p-2">
            <span className="w-full font-medium capitalize">
              <Translate content="customer" />
            </span>
            <span className="w-full font-medium capitalize">
              <Translate content="amount" />
            </span>
            <span className="w-full font-medium capitalize">
              <Translate content="status" />
            </span>
            <span className="w-full font-medium capitalize">
              <Translate content="created at" />
            </span>
            <div className="invisible">
              <CircleTip icon={allIcons.solid.faEllipsisV} />
            </div>
          </div>
          <Line />
          <Scroll>
            {filteredInvoices.length === 0 && !isLoading("fetch-invoices") && (
              <NoInvoicesFound usedBy={usedBy} />
            )}
            <AnimatedList staggerDelay={0.05}>
              {filteredInvoices.map((invoice, index) => (
                <AnimatedListItem key={invoice.id} index={index}>
                  <div className="flex justify-between items-center gap-2 odd:bg-[--biqpod-secondary-background] p-2 rounded-lg">
                    <div className="w-full">
                      <div className="font-medium">{invoice.customerName}</div>
                      {invoice.customerEmail && (
                        <div className="text-[--biqpod-gray-opacity] text-sm">
                          {invoice.customerEmail}
                        </div>
                      )}
                    </div>
                    <div className="w-full font-medium">{invoice.total}DA</div>
                    <div className="w-full">
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <div className="w-full text-[--biqpod-gray-opacity] text-sm">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      {(usedBy === "owned" || usedBy === "read/edit") && (
                        <CircleTip
                          icon={allIcons.solid.faEllipsisV}
                          onClick={() => {
                            // TODO: Add invoice actions menu
                          }}
                        />
                      )}
                    </div>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </Scroll>
        </EmptyComponent>
      )}
      {isSmallView && (
        <Scroll>
          {filteredInvoices.length === 0 && !isLoading("fetch-invoices") && (
            <NoInvoicesFound usedBy={usedBy} />
          )}
          <AnimatedList className="flex flex-col gap-4 p-2" staggerDelay={0.05}>
            {filteredInvoices.map((invoice, index) => (
              <AnimatedListItem key={invoice.id} index={index}>
                <Card className="overflow-hidden">
                  <div className="flex justify-between items-center p-4">
                    <div>
                      <div className="font-medium text-lg">
                        {invoice.customerName}
                      </div>
                      {invoice.customerEmail && (
                        <div className="text-[--biqpod-gray-opacity] text-sm">
                          {invoice.customerEmail}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-xl">
                        {invoice.total}DA
                      </div>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                  </div>
                  <Line />
                  <div className="flex justify-between items-center p-4">
                    <div className="text-[--biqpod-gray-opacity] text-sm">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                    {(usedBy === "owned" || usedBy === "read/edit") && (
                      <CircleTip
                        icon={allIcons.solid.faEllipsisV}
                        onClick={() => {
                          // TODO: Add invoice actions menu
                        }}
                      />
                    )}
                  </div>
                </Card>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </Scroll>
      )}
      <Line />
      <div className="p-3">
        {(usedBy === "owned" || usedBy === "read/edit") && (
          <Button
            icon={allIcons.solid.faPlus}
            onClick={() => showPopup(<CreateInvoicePopup />)}
            className="rounded-full"
          >
            <Translate content="create invoice" />
          </Button>
        )}
      </div>
    </div>
  );
};
