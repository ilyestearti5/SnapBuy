import {
  Button,
  Card,
  CircleTip,
  EmptyComponent,
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
  const usersAccess = useCopyState<SnapBuy.StoreUserAccess[]>([]);
  const error = useCopyState<string | null>(null);

  // Helper function to get user display identifier
  const getUserDisplayName = (user: SnapBuy.StoreUserAccess) => {
    return user.userEmail || user.username || "Unknown User";
  };

  // Helper function to get identifier type
  const getUserIdentifierType = (user: SnapBuy.StoreUserAccess) => {
    return user.userEmail ? "email" : "username";
  };

  const loadUsersAction = useAction(
    "load-users-access",
    async () => {
      try {
        error.set(null);
        const users = await snapbuyApi.getUsersAccessForStore(storeId);
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
    async (accessId: string) => {
      try {
        await snapbuyApi.removeUserAccessFromStore(accessId);
        showToast("User access removed successfully", "success");
        execAction("load-users-access");
      } catch (err) {
        console.error("Failed to remove user access:", err);
        showToast("Failed to remove user access. Please try again.", "error");
      }
    },
    []
  );

  // Load users on component mount
  useEffect(() => {
    execAction("load-users-access");
  }, [storeId]);

  const getStatusColor = (status: SnapBuy.StoreUserAccess["status"]) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPermissionIcon = (permission: string) => {
    return permission === "edit" ? allIcons.solid.faPen : allIcons.solid.faEye;
  };

  const getPermissionColor = (permission: string) => {
    return permission === "edit"
      ? "bg-blue-100 text-blue-800 border-blue-300"
      : "bg-gray-100 text-gray-800 border-gray-300";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditUser = (user: SnapBuy.StoreUserAccess) => {
    showPopup(
      <UpsertAccessUsertoStore
        storeId={storeId}
        existingAccess={user}
        onSuccess={() => execAction("load-users-access")}
      />,
      { type: "blur" }
    );
  };

  const handleRemoveUser = async (user: SnapBuy.StoreUserAccess) => {
    const response = await confirm({
      title: "Remove User Access",
      message: `Are you sure you want to remove access for ${getUserDisplayName(
        user
      )}?`,
      detail: "This user will no longer be able to access your store data.",
    });

    if (response) {
      execAction("remove-user-access", user.id);
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
            <span className="text-gray-600">Loading users...</span>
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
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`fas ${allIcons.solid.faUser.iconName} text-gray-500`}
                        />
                        <span className="font-medium text-gray-900">
                          {getUserDisplayName(user)}
                        </span>
                        <span className="ml-1 text-gray-500 text-xs">
                          ({getUserIdentifierType(user)})
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
                        {user.permissions === "edit"
                          ? "Read & Edit"
                          : "Read Only"}
                      </motion.span>

                      <span className="text-gray-500 text-xs">
                        Added {formatDate(user.createdAt)}
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
                        Invitation sent. User needs to accept the invitation to
                        access your store.
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
                className={`fas ${allIcons.solid.faUsers.iconName} text-4xl text-gray-400`}
              />
            </motion.div>
            <motion.h3
              className="mb-2 font-medium text-gray-900 text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              No Users Added
            </motion.h3>
            <motion.p
              className="mb-4 text-gray-600 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              You haven't invited any users to access your store yet. Add users
              to collaborate on your store management.
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
                Invite First User
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};
