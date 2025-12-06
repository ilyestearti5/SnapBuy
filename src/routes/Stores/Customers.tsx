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
  Field,
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
  getFieldValue,
  useMemoDelay,
} from "@biqpod/app/ui/hooks";
import { useEffect, useState } from "react";
import { snapbuyApi } from "../../apis";
import { delay, range, tw } from "@biqpod/app/ui/utils";
import notFoundPhoto from "../../assets/nothing.png";
import { useStoreId } from "../../utils";
import { useUsedBy } from "../Stores/Stores";
import { motion, AnimatePresence } from "framer-motion";
import { Biqpod } from "@biqpod/app/ui/types";
// Highlight component for search terms
function highlightMatch(
  text: string,
  search: string | undefined
): React.ReactNode {
  if (!search || search.trim() === "") return text;
  const searchLower = search.toLowerCase().trim();
  const textLower = text.toLowerCase();
  // Find all matches for highlighting
  const matches: { start: number; end: number }[] = [];
  // Exact substring matches
  let index = textLower.indexOf(searchLower);
  while (index !== -1) {
    matches.push({ start: index, end: index + searchLower.length });
    index = textLower.indexOf(searchLower, index + 1);
  }
  // If no exact matches, try fuzzy matching
  if (matches.length === 0) {
    let searchIdx = 0;
    for (let i = 0; i < text.length && searchIdx < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIdx]) {
        matches.push({ start: i, end: i + 1 });
        searchIdx++;
      }
    }
  }
  if (matches.length === 0) return text;
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  // Merge overlapping matches
  const mergedMatches: { start: number; end: number }[] = [];
  for (const match of matches) {
    if (mergedMatches.length === 0) {
      mergedMatches.push(match);
    } else {
      const last = mergedMatches[mergedMatches.length - 1];
      if (match.start <= last.end) {
        last.end = Math.max(last.end, match.end);
      } else {
        mergedMatches.push(match);
      }
    }
  }
  // Build the highlighted text
  const result: React.ReactNode[] = [];
  let lastEnd = 0;
  mergedMatches.forEach((match, index) => {
    // Add text before the match
    if (match.start > lastEnd) {
      result.push(text.substring(lastEnd, match.start));
    }
    // Add highlighted match
    result.push(
      <span key={index} className="font-bold text-[--biqpod-primary] underline">
        {text.substring(match.start, match.end)}
      </span>
    );
    lastEnd = match.end;
  });
  // Add remaining text
  if (lastEnd < text.length) {
    result.push(text.substring(lastEnd));
  }
  return result;
}
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
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
  hover: {
    y: -4,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    transition: {
      duration: 0.3,
    },
  },
  tap: {
    transition: {
      duration: 0.1,
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
    x: -10,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
    },
  },
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
    },
  },
};
const iconVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
    },
  },
  hover: {
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
  const customersState = useCopyState<Biqpod.Snapbuy.Customer[]>([]);
  const action = useAction(
    "load-customers",
    async () => {
      if (!storeId) return;
      await delay(1000);
      const customers = await snapbuyApi.customer.getAll(storeId);
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
      await snapbuyApi.customer.updateStatus(data.customerId, data.status);
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
      await snapbuyApi.customer.delete(customerId);
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
          rejectedCustomers.map(
            (customer) => customer.id && snapbuyApi.customer.delete(customer.id)
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
  const renderCustomer = (
    customer: Biqpod.Snapbuy.Customer,
    searchTerm?: string
  ) => {
    const isUpdating = updatingCustomer === customer.id;
    const isDeleting = deletingCustomer === customer.id;
    const isProcessing = isUpdating || isDeleting;
    const showAllMetadata = customer.id
      ? expandedMetadata.has(customer.id)
      : false;
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.2,
                }}
              >
                <motion.p
                  className="font-bold text-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {highlightMatch(
                    `${customer.firstname} ${customer.lastname}`,
                    searchTerm
                  )}
                </motion.p>
                <motion.p
                  className="text-[--biqpod-gray-opacity-2] text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  @{highlightMatch(customer.username, searchTerm)}
                </motion.p>
                <motion.p
                  className="text-[--biqpod-gray-opacity-2] text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {highlightMatch(customer.email, searchTerm)}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.3,
                }}
              >
                <Translate content={customer.status} />
              </motion.div>
              {!isProcessing &&
                (usedBy === "owned" || usedBy === "read/edit") && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                      duration: 0.2,
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
                )}
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
                      <Icon icon={allIcons.solid.faInfo} className="text-xs" />
                    </motion.div>
                    <Translate content="customer insights" />
                  </h4>
                  {hasMoreThan4Items && (
                    <motion.a
                      className="text-xs underline cursor-pointer"
                      onClick={() => customer.id && toggleMetadata(customer.id)}
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 0.3,
            }}
          >
            <Icon
              icon={allIcons.solid.faExclamationTriangle}
              className="mb-4 text-[--biqpod-warning] text-4xl"
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
  // Helper function for search scoring
  function getSearchScore(text: string, search: string): number {
    if (!search) return 1000;
    const textLower = text.toLowerCase();
    const searchLower = search.toLowerCase();
    if (textLower === searchLower) return 1000; // exact match
    if (textLower.startsWith(searchLower)) return 900; // prefix match
    const idx = textLower.indexOf(searchLower);
    if (idx !== -1) return 800 - idx; // substring match, earlier is better
    // Fuzzy: count matching chars in order
    let sIdx = 0,
      match = 0;
    for (let c of textLower) {
      if (c === searchLower[sIdx]) {
        match++;
        sIdx++;
        if (sIdx === searchLower.length) break;
      }
    }
    return match === searchLower.length ? 700 - textLower.length : 0;
  }
  const search = getFieldValue("customer-search");
  const [_, filteredAndSearchedCustomers] = useMemoDelay(
    () => {
      if (!search) return null;
      const searchTerm = search.trim().toLowerCase();
      const allCustomers = [
        ...filteredCustomers.pending,
        ...filteredCustomers.accepted,
        ...filteredCustomers.rejected,
      ];
      return allCustomers
        .filter((customer) => {
          const nameScore = getSearchScore(
            `${customer.firstname} ${customer.lastname}`,
            searchTerm
          );
          const usernameScore = getSearchScore(customer.username, searchTerm);
          const emailScore = getSearchScore(customer.email, searchTerm);
          const phoneScore = getSearchScore(customer.phone, searchTerm);
          return (
            nameScore > 0 ||
            usernameScore > 0 ||
            emailScore > 0 ||
            phoneScore > 0
          );
        })
        .sort((a, b) => {
          const aScore = Math.max(
            getSearchScore(`${a.firstname} ${a.lastname}`, searchTerm),
            getSearchScore(a.username, searchTerm),
            getSearchScore(a.email, searchTerm),
            getSearchScore(a.phone, searchTerm)
          );
          const bScore = Math.max(
            getSearchScore(`${b.firstname} ${b.lastname}`, searchTerm),
            getSearchScore(b.username, searchTerm),
            getSearchScore(b.email, searchTerm),
            getSearchScore(b.phone, searchTerm)
          );
          return bScore - aScore;
        });
    },
    [search, filteredCustomers],
    500
  );
  // Organize searched customers by status
  const searchedCustomers =
    search && filteredAndSearchedCustomers
      ? {
          pending: filteredAndSearchedCustomers.filter(
            (c: Biqpod.Snapbuy.Customer) => c.status === "pending"
          ),
          accepted: filteredAndSearchedCustomers.filter(
            (c: Biqpod.Snapbuy.Customer) => c.status === "accepted"
          ),
          rejected: filteredAndSearchedCustomers.filter(
            (c: Biqpod.Snapbuy.Customer) => c.status === "rejected"
          ),
        }
      : filteredCustomers;
  const displayCustomers = search ? searchedCustomers : filteredCustomers;
  const totalDisplayed =
    search && filteredAndSearchedCustomers
      ? filteredAndSearchedCustomers.length
      : customersState.get.length;
  return (
    <EmptyComponent>
      <motion.div
        className="relative p-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Field
          inputName="customer-search"
          placeholder="search customers by name, username, email or phone"
          className="rounded-xl"
        />
        {search && (
          <span className="top-1/2 right-3 absolute font-bold text-[--biqpod-primary] -translate-y-1/2">
            / {filteredAndSearchedCustomers?.length || 0}
          </span>
        )}
      </motion.div>
      <Line />
      <Scroll className="p-4">
        {/* Search Field */}
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="font-bold text-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
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
              <Translate content="total" />: {totalDisplayed}
            </motion.div>
          </motion.div>
        </motion.div>
        {/* Customers List */}
        {!actionLoading && (
          <EmptyComponent>
            {totalDisplayed > 0 ? (
              <motion.div
                className="flex flex-col gap-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Pending Customers */}
                {displayCustomers.pending.length > 0 && (
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
                          className="text-amber-600"
                        />
                      </motion.div>
                      <Translate content="pending customers" /> (
                      {displayCustomers.pending.length})
                    </motion.h2>
                    <motion.div
                      className="flex flex-col gap-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {displayCustomers.pending.map(
                        (customer: Biqpod.Snapbuy.Customer) =>
                          renderCustomer(customer, search)
                      )}
                    </motion.div>
                  </motion.div>
                )}
                {/* Accepted Customers */}
                {displayCustomers.accepted.length > 0 && (
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
                          className="text-emerald-600"
                        />
                      </motion.div>
                      <Translate content="accepted customers" /> (
                      {displayCustomers.accepted.length})
                    </motion.h2>
                    <motion.div
                      className="flex flex-col gap-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {displayCustomers.accepted.map(
                        (customer: Biqpod.Snapbuy.Customer) =>
                          renderCustomer(customer, search)
                      )}
                    </motion.div>
                  </motion.div>
                )}
                {/* Rejected Customers */}
                {displayCustomers.rejected.length > 0 && (
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
                            className="text-red-600"
                          />
                        </motion.div>
                        <Translate content="rejected customers" /> (
                        {displayCustomers.rejected.length})
                      </motion.h2>
                      {!search && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ delay: 0.8 }}
                        >
                          {(usedBy === "owned" || usedBy === "read/edit") && (
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
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                    <motion.div
                      className="flex flex-col gap-2"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {displayCustomers.rejected.map(
                        (customer: Biqpod.Snapbuy.Customer) =>
                          renderCustomer(customer, search)
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                className="flex justify-center items-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.3,
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
      </Scroll>
    </EmptyComponent>
  );
};
