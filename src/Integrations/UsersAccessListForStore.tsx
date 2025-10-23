import {
  AsyncComponent,
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  openMenu,
  showPopup,
  showToast,
  useCopyState,
  useAction,
  isLoading,
  execAction,
} from "@biqpod/app/ui/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { snapbuyApi } from "../apis";
import { allIcons } from "@biqpod/app/ui/apis";
import { useEffect } from "react";
import { UpsertAccessUsertoStore } from "./UpsertAccessUsertoStore";
import { Biqpod } from "@biqpod/app/ui/types";

interface UsersAccessListForStoreProps {
  storeId: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const userCardVariants = {
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
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const emptyStateVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 30,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 20,
      delay: 0.3,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
};

const loadingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export const UsersAccessListForStore = ({
  storeId,
}: UsersAccessListForStoreProps) => {
  const usersAccess = useCopyState<Snapbuy.StoreUserAccess[]>([]);
  const error = useCopyState<string | null>(null);
  const selectedUsers = useCopyState<string[]>([]);

  // Helper function to get identifier type (simplified since we fetch user)
  const getUserIdentifierType = (fetchedUser: Biqpod.Account.User | null) => {
    if (!fetchedUser) return "user";
    return fetchedUser.email ? "email" : "username";
  };

  const loadUsersAction = useAction(
    "load-users-access",
    async () => {
      try {
        error.set(null);
        const users = await snapbuyApi.access.getUsersAccess(storeId);
        usersAccess.set(users);
      } catch (err) {
        console.error("Failed to load users access:", err);
        error.set("Failed to load users access. Please try again.");
      }
    },
    [storeId]
  );

  useAction(
    "remove-user-access",
    async ({ storeId, relatedUid }) => {
      try {
        await snapbuyApi.access.remove(storeId, relatedUid);
        showToast("User access removed successfully", "success");
        execAction("load-users-access");
      } catch (err) {
        console.error("Failed to remove user access:", err);
        showToast("Failed to remove user access. Please try again.", "error");
      }
    },
    []
  );

  const handleSelectAll = () => {
    const allUids = usersAccess.get
      .map((u) => u.relatedUid)
      .filter((uid): uid is string => Boolean(uid));
    if (selectedUsers.get.length === allUids.length) {
      selectedUsers.set([]);
    } else {
      selectedUsers.set(allUids);
    }
  };

  const handleBulkRemove = async () => {
    const selected = selectedUsers.get;
    if (selected.length === 0) return;

    const response = await confirm({
      title: "Remove Multiple Users",
      message: `Are you sure you want to remove access for ${selected.length} users?`,
      detail: "These users will no longer be able to access your store data.",
    });

    if (response) {
      for (const relatedUid of selected) {
        execAction("remove-user-access", { storeId, relatedUid });
      }
      selectedUsers.set([]);
    }
  };

  // Load users on component mount
  useEffect(() => {
    execAction("load-users-access");
  }, [storeId]);

  const getStatusColor = (status: Snapbuy.StoreUserAccess["status"]) => {
    switch (status) {
      case "accepted":
        return "bg-green-600/25 text-green-600 border-green-300";
      case "pending":
        return "bg-yellow-600/25 text-yellow-600 border-yellow-300";
      case "rejected":
        return "bg-red-600/25 text-red-600 border-red-300";
      default:
        return "bg-gray-600/25 text-gray-600 border-gray-300";
    }
  };

  const getPermissionIcon = (permission: string) => {
    return permission === "edit" ? allIcons.solid.faPen : allIcons.solid.faEye;
  };

  const getPermissionColor = (permission: string) => {
    return permission === "edit"
      ? "bg-blue-400/25 text-blue-400 border-blue-300"
      : "bg-gray-400/25 text-gray-400 border-gray-300";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditUser = (user: Snapbuy.StoreUserAccess) => {
    showPopup(
      <UpsertAccessUsertoStore
        storeId={storeId}
        existingAccess={user}
        onSuccess={() => execAction("load-users-access")}
      />,
      { type: "blur" }
    );
  };

  const handleRemoveUser = async (user: Snapbuy.StoreUserAccess) => {
    let userName = "this user";
    if (user.relatedUid) {
      try {
        const fetchedUser = await snapbuyApi.getUser(user.relatedUid);
        userName = fetchedUser?.firstname || fetchedUser?.email || "this user";
      } catch (err) {
        console.error("Failed to fetch user for confirm:", err);
      }
    }
    if (!user.relatedUid) {
      showToast("Cannot remove access for unknown user.", "error");
      return;
    }
    const response = await confirm({
      title: "Remove User Access",
      message: `Are you sure you want to remove access for ${userName}?`,
      detail: "This user will no longer be able to access your store data.",
    });

    if (response) {
      execAction("remove-user-access", {
        storeId,
        relatedUid: user.relatedUid,
      });
    }
  };

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Error Display */}
      <AnimatePresence>
        {error.get && (
          <motion.div
            className="bg-red-100 px-4 py-3 border border-red-300 rounded-lg text-red-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span
                className={`fas ${allIcons.solid.faExclamationTriangle.iconName}`}
              />
              <span className="text-sm">{error.get}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      {!isLoading(loadUsersAction) && usersAccess.get.length > 0 && (
        <motion.div
          className="flex justify-between items-center bg-gray-50 mb-4 p-3 border rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                usersAccess.get.filter((u) => u.relatedUid).length > 0 &&
                selectedUsers.get.length ===
                  usersAccess.get.filter((u) => u.relatedUid).length
              }
              onChange={handleSelectAll}
              className="w-4 h-4"
            />
            <span className="font-medium text-[--biqpod-text-color] text-sm">
              <Translate content="Select All" />
            </span>
          </div>
          {selectedUsers.get.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleBulkRemove}
                icon={allIcons.solid.faTrash}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 text-white text-sm"
              >
                <Translate content="Delete Selected" /> (
                {selectedUsers.get.length})
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading(loadUsersAction) && (
        <motion.div
          className="flex justify-center items-center py-8"
          variants={loadingVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center gap-3">
            <span
              className={`fas ${allIcons.solid.faSpinner.iconName} animate-spin`}
            />
            <span className="opacity-70 text-[--biqpod-text-color]">
              <Translate content="Loading users..." />
            </span>
          </div>
        </motion.div>
      )}

      {/* Users List */}
      {!isLoading(loadUsersAction) && (
        <EmptyComponent>
          {usersAccess.get.map((user) => (
            <motion.div
              key={user.id}
              variants={userCardVariants}
              whileHover="hover"
            >
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.get.includes(user.relatedUid || "")}
                    onChange={() => {
                      const current = selectedUsers.get;
                      const uid = user.relatedUid || "";
                      if (current.includes(uid)) {
                        selectedUsers.set(
                          current.filter((id: string) => id !== uid)
                        );
                      } else {
                        selectedUsers.set([...current, uid]);
                      }
                    }}
                    className="mt-1 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`fas ${allIcons.solid.faUser.iconName} opacity-60 text-[--biqpod-text-color]`}
                        />
                        <span className="font-medium text-[--biqpod-text-color]">
                          <AsyncComponent
                            deps={[user.relatedUid]}
                            render={async () => {
                              if (!user.relatedUid) {
                                return (
                                  <EmptyComponent>
                                    <Translate content="Unknown User" />
                                  </EmptyComponent>
                                );
                              }
                              const fetchedUser = await snapbuyApi.getUser(
                                user.relatedUid
                              );
                              return (
                                <EmptyComponent>
                                  {fetchedUser?.firstname ||
                                    fetchedUser?.email || (
                                      <Translate content="Unknown User" />
                                    )}
                                </EmptyComponent>
                              );
                            }}
                          />
                        </span>
                        <span className="opacity-60 ml-1 text-[--biqpod-text-color] text-xs">
                          (
                          <AsyncComponent
                            deps={[user.relatedUid]}
                            render={async () => {
                              if (!user.relatedUid) {
                                return (
                                  <EmptyComponent>
                                    <Translate content="user" />
                                  </EmptyComponent>
                                );
                              }
                              const fetchedUser = await snapbuyApi.getUser(
                                user.relatedUid
                              );
                              return (
                                <EmptyComponent>
                                  {getUserIdentifierType(fetchedUser)}
                                </EmptyComponent>
                              );
                            }}
                          />
                          )
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <motion.span
                        className={`px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                          user.status
                        )}`}
                        variants={badgeVariants}
                        whileHover="hover"
                      >
                        {user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)}
                      </motion.span>

                      <motion.span
                        className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getPermissionColor(
                          user.permissions
                        )}`}
                        variants={badgeVariants}
                        whileHover="hover"
                      >
                        <span
                          className={`fas ${
                            getPermissionIcon(user.permissions).iconName
                          }`}
                        />
                        {user.permissions === "edit" ? (
                          <Translate content="Read & Edit" />
                        ) : (
                          <Translate content="Read Only" />
                        )}
                      </motion.span>

                      <span className="opacity-60 text-[--biqpod-text-color] text-xs">
                        <Translate content="Added" />{" "}
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <CircleTip
                        icon={allIcons.solid.faEllipsisVertical}
                        onClick={({ clientX, clientY }) => {
                          openMenu({
                            x: clientX,
                            y: clientY,
                            menu: [
                              {
                                label: "Edit Permissions",
                                defaultIcon: allIcons.solid.faPen,
                                click: () => handleEditUser(user),
                              },
                              {
                                label: "Remove Access",
                                defaultIcon: allIcons.solid.faTrash,
                                click: () => handleRemoveUser(user),
                              },
                            ],
                          });
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {user.status === "pending" && (
                  <motion.div
                    className="bg-yellow-50 mt-3 p-3 border border-yellow-200 rounded-lg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                      <span
                        className={`fas ${allIcons.solid.faClock.iconName}`}
                      />
                      <span>
                        <Translate content="Invitation sent. User needs to accept the invitation to access your store." />
                      </span>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </EmptyComponent>
      )}

      {/* Empty State */}
      {!isLoading(loadUsersAction) && usersAccess.get.length === 0 && (
        <motion.div
          className="py-12 text-center"
          variants={emptyStateVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="mx-auto p-6 max-w-sm">
            <motion.div
              className="mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span
                className={`fas ${allIcons.solid.faUsers.iconName} text-4xl opacity-50 text-[--biqpod-text-color]`}
              />
            </motion.div>
            <motion.h3
              className="mb-2 font-medium text-[--biqpod-text-color] text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Translate content="No Users Added" />
            </motion.h3>
            <motion.p
              className="opacity-70 mb-4 text-[--biqpod-text-color] text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Translate content="You haven't invited any users to access your store yet. Add users to collaborate on your store management." />
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={() =>
                  showPopup(
                    <UpsertAccessUsertoStore
                      storeId={storeId}
                      onSuccess={() => execAction("load-users-access")}
                    />,
                    { type: "blur" }
                  )
                }
                className="px-4 py-2"
                icon={allIcons.solid.faUserPlus}
              >
                <Translate content="Invite First User" />
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};
