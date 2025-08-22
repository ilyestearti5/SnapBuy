import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  Icon,
  Line,
  Scroll,
  Translate,
  Button,
} from "@biqpod/app/ui/components";
import {
  confirm,
  execAction,
  getTemp,
  isLoading,
  openMenu,
  setTemp,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { useEffect, useState } from "react";
import { snapbuyApi } from "../../apis";
import { delay, range, tw } from "@biqpod/app/ui/utils";
import notFoundPhoto from "../../assets/nothing.png";
import { useStoreId } from "../../utils";
export const Customers = () => {
  const storeId = useStoreId();
  const customersState = useCopyState<(SnapBuy.Customer & { id: string })[]>(
    []
  );
  const action = useAction(
    "load-customers",
    async () => {
      if (!storeId) return;
      await delay(1000);
      const customers = await snapbuyApi.getStoreCustomers(storeId);
      customersState.set(customers);
    },
    [storeId]
  );
  const actionLoading = isLoading(action);
  useEffect(() => {
    if (storeId) {
      execAction("load-customers");
    }
  }, [storeId]);
  useAction(
    "update-customer-status",
    async (data: {
      customerId: string;
      status: "pending" | "rejected" | "accepted";
    }) => {
      setTemp("updating-customer", data.customerId);
      await snapbuyApi.updateCustomerStatus(data.customerId, data.status);
      showToast(`Customer ${data.status} successfully`, "success");
      setTemp("updating-customer", null);
      execAction("load-customers");
    },
    []
  );
  useAction(
    "delete-customer",
    async (customerId: string) => {
      setTemp("deleting-customer", customerId);
      await snapbuyApi.deleteCustomer(customerId);
      showToast("Customer deleted successfully", "success");
      setTemp("deleting-customer", null);
      execAction("load-customers");
    },
    []
  );
  const updatingCustomer = getTemp<string>("updating-customer");
  const deletingCustomer = getTemp<string>("deleting-customer");
  const [expandedMetadata, setExpandedMetadata] = useState<Set<string>>(
    new Set()
  );
  const toggleMetadata = (customerId: string) => {
    const newExpanded = new Set(expandedMetadata);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedMetadata(newExpanded);
  };
  const filteredCustomers = {
    pending: customersState.get.filter((c) => c.status === "pending"),
    accepted: customersState.get.filter((c) => c.status === "accepted"),
    rejected: customersState.get.filter((c) => c.status === "rejected"),
  };
  useAction(
    "delete-all-rejected-customers",
    async () => {
      const rejectedCustomers = filteredCustomers.rejected;
      if (rejectedCustomers.length === 0) return;
      setTemp("deleting-all-rejected", true);
      try {
        // Delete all rejected customers
        await Promise.all(
          rejectedCustomers.map((customer) =>
            snapbuyApi.deleteCustomer(customer.id)
          )
        );
        showToast(
          `${rejectedCustomers.length} rejected customers deleted successfully`,
          "success"
        );
        execAction("load-customers");
      } catch (error) {
        showToast("Failed to delete some customers", "error");
      } finally {
        setTemp("deleting-all-rejected", false);
      }
    },
    [filteredCustomers.rejected]
  );
  const renderCustomer = (customer: SnapBuy.Customer & { id: string }) => {
    const isUpdating = updatingCustomer === customer.id;
    const isDeleting = deletingCustomer === customer.id;
    const isProcessing = isUpdating || isDeleting;
    const showAllMetadata = expandedMetadata.has(customer.id);
    const metadataEntries = customer.metaData
      ? Object.entries(customer.metaData)
      : [];
    const hasMoreThan4Items = metadataEntries.length > 4;
    const visibleMetadata = showAllMetadata
      ? metadataEntries
      : metadataEntries.slice(0, 4);
    const hiddenCount = metadataEntries.length - 4;
    return (
      <Card key={customer.id} className="relative overflow-hidden">
        <div className="flex justify-between items-center gap-4 p-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-bold text-lg">
                {customer.firstname} {customer.lastname}
              </p>
              <p className="text-[--biqpod-gray-opacity-2] text-sm">
                @{customer.username}
              </p>
              <p className="text-[--biqpod-gray-opacity-2] text-sm">
                {customer.email}
              </p>
              <p className="text-[--biqpod-gray-opacity-2] text-sm">
                {customer.phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={tw(
                "px-3 py-1 rounded-full text-xs font-semibold uppercase",
                customer.status === "pending" &&
                  "bg-amber-400/10 text-amber-400",
                customer.status === "accepted" &&
                  "bg-emerald-400/10 text-emerald-400",
                customer.status === "rejected" && "bg-red-400/10 text-red-400"
              )}
            >
              <Translate content={customer.status} />
            </div>
            {!isProcessing && (
              <CircleTip
                icon={allIcons.solid.faEllipsisVertical}
                onClick={({ clientX, clientY }) => {
                  openMenu({
                    x: clientX,
                    y: clientY,
                    menu: [
                      ...(customer.status !== "accepted"
                        ? [
                            {
                              label: "Accept",
                              defaultIcon: allIcons.solid.faCheck,
                              click: async () => {
                                const response = await confirm({
                                  title: "Accept Customer",
                                  message: `Are you sure you want to accept ${customer.firstname} ${customer.lastname}?`,
                                });
                                if (response) {
                                  execAction("update-customer-status", {
                                    customerId: customer.id,
                                    status: "accepted",
                                  });
                                }
                              },
                            },
                          ]
                        : []),
                      ...(customer.status !== "rejected"
                        ? [
                            {
                              label: "Reject",
                              defaultIcon: allIcons.solid.faXmark,
                              click: async () => {
                                const response = await confirm({
                                  title: "Reject Customer",
                                  message: `Are you sure you want to reject ${customer.firstname} ${customer.lastname}?`,
                                });
                                if (response) {
                                  execAction("update-customer-status", {
                                    customerId: customer.id,
                                    status: "rejected",
                                  });
                                }
                              },
                            },
                          ]
                        : []),
                      ...(customer.status !== "pending"
                        ? [
                            {
                              label: "Mark as Pending",
                              defaultIcon: allIcons.solid.faClock,
                              click: async () => {
                                const response = await confirm({
                                  title: "Mark as Pending",
                                  message: `Are you sure you want to mark ${customer.firstname} ${customer.lastname} as pending?`,
                                });
                                if (response) {
                                  execAction("update-customer-status", {
                                    customerId: customer.id,
                                    status: "pending",
                                  });
                                }
                              },
                            },
                          ]
                        : []),
                      {
                        label: "Delete",
                        defaultIcon: allIcons.solid.faTrash,
                        click: async () => {
                          const response = await confirm({
                            title: "Delete Customer",
                            message: `Are you sure you want to delete ${customer.firstname} ${customer.lastname}?`,
                            detail: "This action cannot be undone.",
                          });
                          if (response) {
                            execAction("delete-customer", customer.id);
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
        {/* Metadata Section */}
        {customer.metaData && Object.keys(customer.metaData).length > 0 && (
          <EmptyComponent>
            <Line />
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="flex items-center gap-2 text-[--biqpod-gray-opacity-2] font-semibold text-sm">
                  <Icon icon={allIcons.solid.faInfo} iconClassName="text-xs" />
                  <Translate content="customer insights" />
                </h4>
                {hasMoreThan4Items && (
                  <a
                    className="text-xs underline"
                    onClick={() => toggleMetadata(customer.id)}
                  >
                    {showAllMetadata ? (
                      <Translate content="show less" />
                    ) : (
                      <span>
                        <Translate content="show more" /> (+{hiddenCount})
                      </span>
                    )}
                  </a>
                )}
              </div>
              <div className="gap-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
                {visibleMetadata.map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-[--biqpod-primary-background] px-2 py-1 rounded text-xs"
                  >
                    <span className="font-medium">{key}:</span>{" "}
                    <span className="text-[--biqpod-gray-opacity-2]">
                      {Array.isArray(value) ? (
                        value.join(", ")
                      ) : typeof value === "boolean" ? (
                        value ? (
                          <Translate content="yes" />
                        ) : (
                          <Translate content="no" />
                        )
                      ) : typeof value === "number" && key.includes("Date") ? (
                        new Date(value).toLocaleDateString()
                      ) : (
                        String(value)
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {/* Additional metadata with animation */}
              {hasMoreThan4Items && (
                <div
                  className={tw(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    showAllMetadata
                      ? "max-h-96 opacity-100 mt-2"
                      : "max-h-0 opacity-0"
                  )}
                >
                  <div className="gap-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 pt-2">
                    {metadataEntries.slice(4).map(([key, value]) => (
                      <div
                        key={key}
                        className="bg-[--biqpod-primary-background] px-2 py-1 rounded text-xs hover:scale-105 transition-transform duration-200 transform"
                      >
                        <span className="font-medium">{key}:</span>{" "}
                        <span className="text-[--biqpod-gray-opacity-2]">
                          {Array.isArray(value) ? (
                            value.join(", ")
                          ) : typeof value === "boolean" ? (
                            value ? (
                              <Translate content="yes" />
                            ) : (
                              <Translate content="no" />
                            )
                          ) : typeof value === "number" &&
                            key.includes("Date") ? (
                            new Date(value).toLocaleDateString()
                          ) : (
                            String(value)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </EmptyComponent>
        )}
        <Line />
        <div className="flex justify-between items-center text-[--biqpod-gray-opacity-2] p-3 text-xs">
          <span>
            <Translate content="joined" />:{" "}
            {new Date(customer.createdAt).toLocaleDateString()}
          </span>
        </div>
        {isProcessing && (
          <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity] backdrop-blur-sm">
            <div className="border-[--biqpod-primary] border-4 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
          </div>
        )}
      </Card>
    );
  };
  if (!storeId) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <Icon
            icon={allIcons.solid.faExclamationTriangle}
            iconClassName="text-4xl text-[--biqpod-warning] mb-4"
          />
          <p className="text-xl">
            <Translate content="no store selected" />
          </p>
        </div>
      </div>
    );
  }
  return (
    <Scroll>
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-bold text-3xl">
            <Translate content="customers" />
          </h1>
          <div className="flex items-center gap-2">
            <div className="bg-[--biqpod-primary-background] px-3 py-1 rounded-full text-sm">
              <Translate content="total" />: {customersState.get.length}
            </div>
          </div>
        </div>
        {/* Statistics Cards */}
        {!actionLoading && (
          <div className="gap-4 grid md:grid-cols-3 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-amber-400/10 rounded-full w-12 h-12">
                  <Icon
                    icon={allIcons.solid.faClock}
                    iconClassName="text-xl text-amber-400"
                  />
                </div>
                <div>
                  <p className="font-bold text-2xl">
                    {filteredCustomers.pending.length}
                  </p>
                  <p className="text-[--biqpod-gray-opacity-2] text-sm">
                    <Translate content="pending" />
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-emerald-400/10 rounded-full w-12 h-12">
                  <Icon
                    icon={allIcons.solid.faCheck}
                    iconClassName="text-xl text-emerald-400"
                  />
                </div>
                <div>
                  <p className="font-bold text-2xl">
                    {filteredCustomers.accepted.length}
                  </p>
                  <p className="text-[--biqpod-gray-opacity-2] text-sm">
                    <Translate content="accepted" />
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-red-400/10 rounded-full w-12 h-12">
                  <Icon
                    icon={allIcons.solid.faXmark}
                    iconClassName="text-xl text-red-400"
                  />
                </div>
                <div>
                  <p className="font-bold text-2xl">
                    {filteredCustomers.rejected.length}
                  </p>
                  <p className="text-[--biqpod-gray-opacity-2] text-sm">
                    <Translate content="rejected" />
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
        {actionLoading && (
          <div className="gap-4 grid md:grid-cols-3 mb-6">
            {range(3).map((index) => {
              return (
                <CardWait className="rounded-2xl w-full h-[80px]" key={index} />
              );
            })}
          </div>
        )}
        {/* Customers List */}
        {!actionLoading && (
          <EmptyComponent>
            {customersState.get.length > 0 ? (
              <div className="flex flex-col gap-3">
                {/* Pending Customers */}
                {filteredCustomers.pending.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 mb-3 font-semibold text-lg">
                      <Icon
                        icon={allIcons.solid.faClock}
                        iconClassName="text-amber-600"
                      />
                      <Translate content="pending customers" /> (
                      {filteredCustomers.pending.length})
                    </h2>
                    <div className="flex flex-col gap-2">
                      {filteredCustomers.pending.map(renderCustomer)}
                    </div>
                  </div>
                )}
                {/* Accepted Customers */}
                {filteredCustomers.accepted.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-2 mb-3 font-semibold text-lg">
                      <Icon
                        icon={allIcons.solid.faCheck}
                        iconClassName="text-emerald-600"
                      />
                      <Translate content="accepted customers" /> (
                      {filteredCustomers.accepted.length})
                    </h2>
                    <div className="flex flex-col gap-2">
                      {filteredCustomers.accepted.map(renderCustomer)}
                    </div>
                  </div>
                )}
                {/* Rejected Customers */}
                {filteredCustomers.rejected.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="flex items-center gap-2 font-semibold text-lg">
                        <Icon
                          icon={allIcons.solid.faXmark}
                          iconClassName="text-red-600"
                        />
                        <Translate content="rejected customers" /> (
                        {filteredCustomers.rejected.length})
                      </h2>
                      <Button
                        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded w-fit text-white text-sm"
                        icon={allIcons.solid.faTrash}
                        onClick={async () => {
                          const response = await confirm({
                            title: "Delete All Rejected Customers",
                            message: `Are you sure you want to delete all ${filteredCustomers.rejected.length} rejected customers?`,
                            detail: "This action cannot be undone.",
                          });
                          if (response) {
                            execAction("delete-all-rejected-customers");
                          }
                        }}
                        disabled={isLoading("delete-all-rejected-customers")}
                      >
                        {isLoading("delete-all-rejected-customers") ? (
                          <Translate content="deleting" />
                        ) : (
                          <Translate content="delete all" />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredCustomers.rejected.map(renderCustomer)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center py-12">
                <Card className="w-full max-w-md overflow-hidden">
                  <img
                    draggable="false"
                    src={notFoundPhoto}
                    alt="No customers"
                  />
                  <Line />
                  <div className="p-6 text-center">
                    <h3 className="mb-2 font-bold text-2xl">
                      <Translate content="no customers found" />
                    </h3>
                    <p className="text-[--biqpod-gray-opacity-2]">
                      <Translate content="customers will appear here when they register for your store" />
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </EmptyComponent>
        )}
        {/* Loading State */}
        {actionLoading && (
          <div className="flex flex-col gap-3">
            {range(5).map((index) => (
              <CardWait key={index} className="rounded-2xl">
                <div className="flex justify-between items-center p-4">
                  <div className="flex flex-col gap-2 w-full">
                    <CardWait className="rounded-full w-full h-[30px]" />
                    <CardWait className="rounded-full w-1/3 h-[20px]" />
                    <CardWait className="rounded-full w-1/4 h-[20px]" />
                    <CardWait className="rounded-full w-1/2 h-[20px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <CardWait className="rounded-full w-[120px] h-[20px]" />
                    <CardWait className="rounded-full w-[40px] h-[40px]" />
                  </div>
                </div>
                <Line />
                <div className="flex flex-col gap-2 p-4">
                  {range(4).map((index) => {
                    return (
                      <CardWait
                        className={tw(
                          "rounded-full h-[20px]",
                          index % 2 === 0 ? "w-1/2" : "w-full"
                        )}
                      />
                    );
                  })}
                </div>
                <Line />
                <div className="flex flex-col gap-2 p-4">
                  <CardWait className="rounded-full w-[120px] h-[20px]" />
                </div>
              </CardWait>
            ))}
          </div>
        )}
      </div>
    </Scroll>
  );
};
