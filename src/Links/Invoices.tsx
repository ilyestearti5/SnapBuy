import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleTip,
  EmptyComponent,
  Field,
  IconProps,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  execAction,
  getFieldValue,
  isLoading,
  setTemp,
  showPopup,
  setFieldValue,
  closePopup,
  useAction,
  useDeviceResolution,
  useTemp,
  openMenu,
  confirm,
  showToast,
} from "@biqpod/app/ui/hooks";
import { fuzzySearch, tw } from "@biqpod/app/ui/utils";
import { useMemo, useEffect } from "react";
import { useStoreId } from "../utils";
import { AnimatedList, AnimatedListItem } from "../animations";
import { useUsedBy } from "../routes/Stores/Stores";
import { Biqpod } from "@biqpod/app/ui/types";
import { UpsertInvoice } from "./CreateInvoicePopup";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { snapbuyApi } from "../apis";
import { CreateFirstUI } from "../components/CreateFirstUI";
const NoInvoicesFound = () => {
  return (
    <CreateFirstUI
      photo="https://cdn3d.iconscout.com/3d/premium/thumb/invoice-3d-icon-png-download-7869546.png"
      title="No Invoices Found"
      description="You have no invoices yet. Create your first invoice to get started."
    />
  );
};
const ChangeStatusPopup = ({
  invoice,
}: {
  invoice: Biqpod.Snapbuy.Invoice;
}) => {
  // clear the note when opening
  useEffect(() => {
    setFieldValue("status-note", "");
  }, [invoice?.id]);
  const note = getFieldValue("status-note");
  const statuses = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
  type Status = (typeof statuses)[number];
  const changeStatus = async (status: Status) => {
    try {
      const response = await confirm({
        title: "Change Invoice Status",
        message: `Are you sure you want to change the status to "${status}"?`,
        detail: note ? `Note: ${note}` : undefined,
        type: "warning",
      });
      if (!response) {
        return;
      }
      await snapbuyApi.invoice.create({ id: invoice.id, status, notes: note });
      showToast(`Invoice status updated to ${status}`, "success");
      closePopup();
      execAction("fetch-invoices");
    } catch (error) {
      console.error("Failed to update invoice status:", error);
      showToast("Failed to update invoice status", "error");
    }
  };
  const icons: Record<string, IconProps["icon"]> = {
    draft: allIcons.solid.faFileAlt,
    sent: allIcons.solid.faPaperPlane,
    paid: allIcons.solid.faCheckCircle,
    overdue: allIcons.solid.faExclamationCircle,
    cancelled: allIcons.solid.faTimesCircle,
  };
  const colors: Record<string, string> = {
    draft: "text-gray-500",
    sent: "text-blue-500",
    paid: "text-green-500",
    overdue: "text-red-500",
    cancelled: "text-gray-500",
  };
  const bgColors: Record<string, string> = {
    draft: "bg-gray-500/10",
    sent: "bg-blue-500/10",
    paid: "bg-green-500/10",
    overdue: "bg-red-500/10",
    cancelled: "bg-gray-500/10",
  };
  return (
    <Card className="w-96">
      <CardHeaderForPopup title="change invoice status" />
      <Line />
      <div className="flex justify-between items-center p-3">
        <div className="font-medium">Current status</div>
        <div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Field
          inputName="status-note"
          className="rounded-xl"
          placeholder="Optional note (reason)"
        />
      </div>
      <Line />
      <div className="p-2">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Button
              key={s}
              className={tw("rounded-full w-fit", colors[s], bgColors[s])}
              disabled={s === invoice.status}
              icon={icons[s]}
              onClick={() => changeStatus(s)}
            >
              <Translate content={s} />
            </Button>
          ))}
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Button
          className="bg-[--biqpod-gray-opacity] rounded-full"
          onClick={() => closePopup()}
        >
          <Translate content="cancel" />
        </Button>
      </div>
    </Card>
  );
};
export const Invoices = () => {
  const searchInvoice = getFieldValue("search-invoice");
  const invoices = useTemp<Biqpod.Snapbuy.Invoice[]>("invoices-list");
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  useAction(
    "fetch-invoices",
    async () => {
      if (!storeId) {
        return;
      }
      const result = await snapbuyApi.invoice.getAll(storeId);
      if (!result) {
        return;
      }
      setTemp(
        "invoices-list",
        result.sort((a, b) => {
          return (b.createdAt || 0) - (a.createdAt || 0);
        })
      );
    },
    [storeId]
  );
  useEffect(() => {
    if (storeId) {
      execAction("fetch-invoices");
    }
  }, [storeId]);
  const filteredInvoices = useMemo(() => {
    if (!invoices.get) return [];
    return invoices.get.filter((invoice) =>
      fuzzySearch(
        `${invoice.id} ${invoice.customerName} ${invoice.status}`,
        searchInvoice || ""
      )
    );
  }, [searchInvoice, invoices.get]);
  const { isMobile, isTablet } = useDeviceResolution();
  const isSmallView = isMobile || isTablet;
  const loading = isLoading("fetch-invoices");
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
              <NoInvoicesFound />
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
                      {new Date(invoice.createdAt!).toLocaleDateString()}
                    </div>
                    <div>
                      {(usedBy === "owned" || usedBy === "read/edit") && (
                        <CircleTip
                          icon={allIcons.solid.faEllipsisV}
                          onClick={({ clientX, clientY }) => {
                            openMenu({
                              x: clientX,
                              y: clientY,
                              menu: [
                                {
                                  label: "View Details",
                                  defaultIcon: allIcons.solid.faEye,
                                  click: () => {
                                    showToast(
                                      "View invoice details - Coming soon",
                                      "info"
                                    );
                                  },
                                },
                                {
                                  label: "Edit",
                                  defaultIcon: allIcons.solid.faEdit,
                                  click: () => {
                                    showToast(
                                      "Edit invoice - Coming soon",
                                      "info"
                                    );
                                  },
                                },
                                {
                                  label: "Change Status",
                                  defaultIcon: allIcons.solid.faExchange,
                                  click: () =>
                                    showPopup(
                                      <ChangeStatusPopup invoice={invoice} />
                                    ),
                                },
                                {
                                  label: "Download PDF",
                                  defaultIcon: allIcons.solid.faDownload,
                                  click: () => {
                                    showToast(
                                      "Download PDF - Coming soon",
                                      "info"
                                    );
                                  },
                                },
                                {
                                  label: "Delete",
                                  defaultIcon: allIcons.solid.faTrash,
                                  click: async () => {
                                    const response = await confirm({
                                      title: "Delete Invoice",
                                      message: `Are you sure you want to delete invoice for ${invoice.customerName}?`,
                                      detail: "This action cannot be undone.",
                                    });
                                    if (response) {
                                      await snapbuyApi.invoice.delete(
                                        invoice.id!
                                      );
                                      showToast(
                                        "Invoice deleted successfully",
                                        "success"
                                      );
                                      execAction("fetch-invoices");
                                    }
                                  },
                                },
                              ],
                            });
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
          {filteredInvoices.length === 0 && !loading && <NoInvoicesFound />}
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
                      {new Date(invoice.createdAt!).toLocaleDateString()}
                    </div>
                    {(usedBy === "owned" || usedBy === "read/edit") && (
                      <CircleTip
                        icon={allIcons.solid.faEllipsisV}
                        onClick={({ clientX, clientY }) => {
                          openMenu({
                            x: clientX,
                            y: clientY,
                            menu: [
                              {
                                label: "View Details",
                                defaultIcon: allIcons.solid.faEye,
                                click: () => {
                                  showToast(
                                    "View invoice details - Coming soon",
                                    "info"
                                  );
                                },
                              },
                              {
                                label: "Edit",
                                defaultIcon: allIcons.solid.faEdit,
                                click: () => {
                                  showPopup(
                                    <UpsertInvoice invoice={invoice} />
                                  );
                                },
                              },
                              {
                                label: "Change Status",
                                defaultIcon: allIcons.solid.faExchange,
                                click: () =>
                                  showPopup(
                                    <ChangeStatusPopup invoice={invoice} />
                                  ),
                              },
                              {
                                label: "Download PDF",
                                defaultIcon: allIcons.solid.faDownload,
                                click: () => {
                                  showToast(
                                    "Download PDF - Coming soon",
                                    "info"
                                  );
                                },
                              },
                              {
                                label: "Delete",
                                defaultIcon: allIcons.solid.faTrash,
                                click: async () => {
                                  const response = await confirm({
                                    title: "Delete Invoice",
                                    message: `Are you sure you want to delete invoice for ${invoice.customerName}?`,
                                    detail: "This action cannot be undone.",
                                    type: "warning",
                                  });
                                  if (response) {
                                    await snapbuyApi.invoice.delete(
                                      invoice.id!
                                    );
                                    showToast(
                                      "Invoice deleted successfully",
                                      "success"
                                    );
                                    execAction("fetch-invoices");
                                  }
                                },
                              },
                            ],
                          });
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
            onClick={() => showPopup(<UpsertInvoice />)}
            className="rounded-full"
          >
            <Translate content="create invoice" />
          </Button>
        )}
      </div>
    </div>
  );
};
