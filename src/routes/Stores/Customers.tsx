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
import { useUsedBy } from "../Stores/Stores";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: {
      duration: 0.3,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

const statsCardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 30,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
  hover: {
    scale: 1.05,
    y: -5,
    transition: {
      duration: 0.2,
    },
  },
};

const metadataVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    height: "auto",
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -10,
    transition: {
      duration: 0.3,
    },
  },
};

const metadataItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    x: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.3,
    },
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      duration: 0.2,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
    },
  },
  hover: {
    scale: 1.2,
    transition: {
      duration: 0.2,
    },
  },
};

const loadingSpinVariants = {
  hidden: { rotate: 0 },
  visible: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
    },
  },
};

export const Customers = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const customersState = useCopyState<(Souqify.Customer & { id: string })[]>(
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
  const renderCustomer = (customer: Souqify.Customer & { id: string }) => {
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
      <motion.div
        key={customer.id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        layout
        layoutId={`customer-${customer.id}`}
      >
        <Card className="relative overflow-hidden">
          <motion.div
            className="flex justify-between items-center gap-4 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
              >
                <motion.p
                  className="font-bold text-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {customer.firstname} {customer.lastname}
                </motion.p>
                <motion.p
                  className="text-[--biqpod-gray-opacity-2] text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  @{customer.username}
                </motion.p>
                <motion.p
                  className="text-[--biqpod-gray-opacity-2] text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {customer.email}
                </motion.p>
                <motion.p
                  className="text-[--biqpod-gray-opacity-2] text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {customer.phone}
                </motion.p>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className={tw(
                  "px-3 py-1 rounded-full text-xs font-semibold uppercase",
                  customer.status === "pending" &&
                    "bg-amber-400/10 text-amber-400",
                  customer.status === "accepted" &&
                    "bg-emerald-400/10 text-emerald-400",
                  customer.status === "rejected" && "bg-red-400/10 text-red-400"
                )}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                <Translate content={customer.status} />
              </motion.div>
              {(!isProcessing && usedBy === "owned") ||
                (usedBy === "read/edit" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: 0.4,
                    }}
                  >
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
                  </motion.div>
                ))}
            </div>
          </motion.div>
          {/* Metadata Section */}
          {customer.metaData && Object.keys(customer.metaData).length > 0 && (
            <EmptyComponent>
              <Line />
              <motion.div
                className="p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <motion.div
                  className="flex justify-between items-center mb-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <h4 className="flex items-center gap-2 text-[--biqpod-gray-opacity-2] font-semibold text-sm">
                    <motion.div
                      variants={iconVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <Icon
                        icon={allIcons.solid.faInfo}
                        iconClassName="text-xs"
                      />
                    </motion.div>
                    <Translate content="customer insights" />
                  </h4>
                  {hasMoreThan4Items && (
                    <motion.a
                      className="text-xs underline cursor-pointer"
                      onClick={() => toggleMetadata(customer.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {showAllMetadata ? (
                        <Translate content="show less" />
                      ) : (
                        <span>
                          <Translate content="show more" /> (+{hiddenCount})
                        </span>
                      )}
                    </motion.a>
                  )}
                </motion.div>
                <motion.div
                  className="gap-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {visibleMetadata.map(([key, value], index) => (
                    <motion.div
                      key={key}
                      className="bg-[--biqpod-primary-background] px-2 py-1 rounded text-xs"
                      variants={metadataItemVariants}
                      whileHover="hover"
                      custom={index}
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
                    </motion.div>
                  ))}
                </motion.div>
                {/* Additional metadata with animation */}
                <AnimatePresence>
                  {hasMoreThan4Items && showAllMetadata && (
                    <motion.div
                      variants={metadataVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="overflow-hidden"
                    >
                      <motion.div
                        className="gap-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 pt-2"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {metadataEntries.slice(4).map(([key, value], index) => (
                          <motion.div
                            key={key}
                            className="bg-[--biqpod-primary-background] px-2 py-1 rounded text-xs"
                            variants={metadataItemVariants}
                            whileHover="hover"
                            custom={index}
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
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </EmptyComponent>
          )}
          <Line />
          <motion.div
            className="flex justify-between items-center text-[--biqpod-gray-opacity-2] p-3 text-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span>
              <Translate content="joined" />:{" "}
              {new Date(customer.createdAt).toLocaleDateString()}
            </span>
          </motion.div>
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity] backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="border-[--biqpod-primary] border-4 border-t-transparent rounded-full w-8 h-8"
                  variants={loadingSpinVariants}
                  initial="hidden"
                  animate="visible"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };
  if (!storeId) {
    return (
      <motion.div
        className="flex justify-center items-center p-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              delay: 0.3,
            }}
          >
            <Icon
              icon={allIcons.solid.faExclamationTriangle}
              iconClassName="text-4xl text-[--biqpod-warning] mb-4"
            />
          </motion.div>
          <motion.p
            className="text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Translate content="no store selected" />
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }
  return (
    <Scroll>
      <div className="p-4">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="font-bold text-3xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              delay: 0.2,
            }}
          >
            <Translate content="customers" />
          </motion.h1>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="bg-[--biqpod-primary-background] px-3 py-1 rounded-full text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Translate content="total" />: {customersState.get.length}
            </motion.div>
          </motion.div>
        </motion.div>
        {/* Statistics Cards */}
        {!actionLoading && (
          <motion.div
            className="gap-4 grid md:grid-cols-3 mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={statsCardVariants} whileHover="hover">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="flex justify-center items-center bg-amber-400/10 rounded-full w-12 h-12"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      variants={iconVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <Icon
                        icon={allIcons.solid.faClock}
                        iconClassName="text-xl text-amber-400"
                      />
                    </motion.div>
                  </motion.div>
                  <div>
                    <motion.p
                      className="font-bold text-2xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: 0.3,
                      }}
                    >
                      {filteredCustomers.pending.length}
                    </motion.p>
                    <motion.p
                      className="text-[--biqpod-gray-opacity-2] text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Translate content="pending" />
                    </motion.p>
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div variants={statsCardVariants} whileHover="hover">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="flex justify-center items-center bg-emerald-400/10 rounded-full w-12 h-12"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      variants={iconVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <Icon
                        icon={allIcons.solid.faCheck}
                        iconClassName="text-xl text-emerald-400"
                      />
                    </motion.div>
                  </motion.div>
                  <div>
                    <motion.p
                      className="font-bold text-2xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: 0.3,
                      }}
                    >
                      {filteredCustomers.accepted.length}
                    </motion.p>
                    <motion.p
                      className="text-[--biqpod-gray-opacity-2] text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Translate content="accepted" />
                    </motion.p>
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div variants={statsCardVariants} whileHover="hover">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="flex justify-center items-center bg-red-400/10 rounded-full w-12 h-12"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      variants={iconVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <Icon
                        icon={allIcons.solid.faXmark}
                        iconClassName="text-xl text-red-400"
                      />
                    </motion.div>
                  </motion.div>
                  <div>
                    <motion.p
                      className="font-bold text-2xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        delay: 0.3,
                      }}
                    >
                      {filteredCustomers.rejected.length}
                    </motion.p>
                    <motion.p
                      className="text-[--biqpod-gray-opacity-2] text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Translate content="rejected" />
                    </motion.p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
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
              <motion.div
                className="flex flex-col gap-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Pending Customers */}
                {filteredCustomers.pending.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.h2
                      className="flex items-center gap-2 mb-3 font-semibold text-lg"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div
                        variants={iconVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                      >
                        <Icon
                          icon={allIcons.solid.faClock}
                          iconClassName="text-amber-600"
                        />
                      </motion.div>
                      <Translate content="pending customers" /> (
                      {filteredCustomers.pending.length})
                    </motion.h2>
                    <motion.div
                      className="flex flex-col gap-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredCustomers.pending.map(renderCustomer)}
                    </motion.div>
                  </motion.div>
                )}
                {/* Accepted Customers */}
                {filteredCustomers.accepted.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.h2
                      className="flex items-center gap-2 mb-3 font-semibold text-lg"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        variants={iconVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                      >
                        <Icon
                          icon={allIcons.solid.faCheck}
                          iconClassName="text-emerald-600"
                        />
                      </motion.div>
                      <Translate content="accepted customers" /> (
                      {filteredCustomers.accepted.length})
                    </motion.h2>
                    <motion.div
                      className="flex flex-col gap-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredCustomers.accepted.map(renderCustomer)}
                    </motion.div>
                  </motion.div>
                )}
                {/* Rejected Customers */}
                {filteredCustomers.rejected.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className="flex justify-between items-center mb-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <motion.h2
                        className="flex items-center gap-2 font-semibold text-lg"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        <motion.div
                          variants={iconVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover="hover"
                        >
                          <Icon
                            icon={allIcons.solid.faXmark}
                            iconClassName="text-red-600"
                          />
                        </motion.div>
                        <Translate content="rejected customers" /> (
                        {filteredCustomers.rejected.length})
                      </motion.h2>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ delay: 0.8 }}
                      >
                        {usedBy === "owned" ||
                          (usedBy === "read/edit" && (
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
                              disabled={isLoading(
                                "delete-all-rejected-customers"
                              )}
                            >
                              {isLoading("delete-all-rejected-customers") ? (
                                <Translate content="deleting" />
                              ) : (
                                <Translate content="delete all" />
                              )}
                            </Button>
                          ))}
                      </motion.div>
                    </motion.div>
                    <motion.div
                      className="flex flex-col gap-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {filteredCustomers.rejected.map(renderCustomer)}
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                className="flex justify-center items-center py-12"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="w-full max-w-md overflow-hidden">
                    <motion.img
                      draggable="false"
                      src={notFoundPhoto}
                      alt="No customers"
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <Line />
                    <motion.div
                      className="p-6 text-center"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.h3
                        className="mb-2 font-bold text-2xl"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          delay: 0.4,
                        }}
                      >
                        <Translate content="no customers found" />
                      </motion.h3>
                      <motion.p
                        className="text-[--biqpod-gray-opacity-2]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Translate content="customers will appear here when they register for your store" />
                      </motion.p>
                    </motion.div>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </EmptyComponent>
        )}
        {/* Loading State */}
        {actionLoading && (
          <motion.div
            className="flex flex-col gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {range(5).map((index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                custom={index}
                whileHover={{ scale: 1.01 }}
              >
                <CardWait className="rounded-2xl">
                  <motion.div
                    className="flex justify-between items-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{
                          delay: index * 0.1 + 0.1,
                          duration: 0.8,
                        }}
                      >
                        <CardWait className="rounded-full w-full h-[30px]" />
                      </motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "33%" }}
                        transition={{
                          delay: index * 0.1 + 0.2,
                          duration: 0.6,
                        }}
                      >
                        <CardWait className="rounded-full w-1/3 h-[20px]" />
                      </motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "25%" }}
                        transition={{
                          delay: index * 0.1 + 0.3,
                          duration: 0.6,
                        }}
                      >
                        <CardWait className="rounded-full w-1/4 h-[20px]" />
                      </motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "50%" }}
                        transition={{
                          delay: index * 0.1 + 0.4,
                          duration: 0.6,
                        }}
                      >
                        <CardWait className="rounded-full w-1/2 h-[20px]" />
                      </motion.div>
                    </div>
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      <CardWait className="rounded-full w-[120px] h-[20px]" />
                      <motion.div
                        animate={{ scale: 1.1 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      >
                        <CardWait className="rounded-full w-[40px] h-[40px]" />
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  <Line />
                  <motion.div
                    className="flex flex-col gap-2 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    {range(4).map((metaIndex) => (
                      <motion.div
                        key={metaIndex}
                        initial={{ width: 0 }}
                        animate={{
                          width: metaIndex % 2 === 0 ? "50%" : "100%",
                        }}
                        transition={{
                          delay: index * 0.1 + 0.6 + metaIndex * 0.1,
                          duration: 0.5,
                        }}
                      >
                        <CardWait
                          className={tw(
                            "rounded-full h-[20px]",
                            metaIndex % 2 === 0 ? "w-1/2" : "w-full"
                          )}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                  <Line />
                  <motion.div
                    className="flex flex-col gap-2 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.8 }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "120px" }}
                      transition={{
                        delay: index * 0.1 + 0.9,
                        duration: 0.4,
                      }}
                    >
                      <CardWait className="rounded-full w-[120px] h-[20px]" />
                    </motion.div>
                  </motion.div>
                </CardWait>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Scroll>
  );
};
