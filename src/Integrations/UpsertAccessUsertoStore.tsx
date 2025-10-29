import {
  AsyncComponent,
  Button,
  Card,
  CardHeaderForPopup,
  CircleTip,
  EmptyComponent,
  EnumField,
  Field,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  isLoading,
  showToast,
  useAction,
  useCopyState,
  useAsyncMemo,
} from "@biqpod/app/ui/hooks";
import { highlightMatch } from "../routes/Clients/ClientProductRender";
import { motion, AnimatePresence } from "framer-motion";
import { snapbuyApi } from "../apis";
import { allIcons } from "@biqpod/app/ui/apis";
import { Biqpod } from "@biqpod/app/ui/types";
import { useMemo } from "react";

type UserWithId = Biqpod.Account.User & { id: string };

interface UpsertAccessUsertoStoreProps {
  storeId: string;
  existingAccess?: Biqpod.Snapbuy.StoreUserAccess;
  onSuccess?: () => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.98 },
};

const errorVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export const UpsertAccessUsertoStore = ({
  storeId,
  existingAccess,
  onSuccess,
}: UpsertAccessUsertoStoreProps) => {
  const error = useCopyState<string | null>(null);
  const searchTerm = useCopyState<string>("");
  const selectedUser = useCopyState<UserWithId | null>(null);
  const showDropdown = useCopyState<boolean>(false);
  const permissions = useCopyState<string | false | 0 | null | undefined>(
    existingAccess?.permissions || "read"
  );

  // Fetch all users once
  const allUsers = useAsyncMemo(async () => {
    return await snapbuyApi.friends.getList(100); // Get more users for better search
  }, []);

  // Filter users based on search term
  const filteredUsers = useMemo((): UserWithId[] => {
    if (!searchTerm.get || searchTerm.get.length < 1) return [];
    const term = searchTerm.get.toLowerCase();
    return (
      allUsers?.filter(
        (user) =>
          user.firstname?.toLowerCase().includes(term) ||
          user.lastname?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.id?.toLowerCase().includes(term) ||
          user.username?.toLowerCase().includes(term)
      ) || []
    );
  }, [searchTerm.get, allUsers]);

  const permissionOptions = [
    { value: "read", content: "Read Only" },
    { value: "edit", content: "Read & Edit" },
  ];

  const action = useAction(
    "upsert-user-access",
    async () => {
      error.set(null);

      if (!selectedUser.get) {
        error.set("Please select a user to invite");
        return;
      }

      if (!permissions.get) {
        error.set("Permission level is required");
        return;
      }

      try {
        if (existingAccess) {
          // Update existing access
          await snapbuyApi.access.updateUser(existingAccess.id, {
            permissions: permissions.get === "edit" ? "edit" : "read",
          });
          showToast("User access updated successfully", "success");
        } else {
          // Add new access
          const accessData = {
            userId: selectedUser.get!.uid!,
            permissions: (permissions.get === "edit" ? "edit" : "read") as
              | "read"
              | "edit",
          };

          await snapbuyApi.access.addUser(storeId, accessData);
          showToast("User access invitation sent successfully", "success");
        }

        // Clear form
        searchTerm.set("");
        selectedUser.set(null);
        permissions.set("read");

        onSuccess?.();
        closePopup();
      } catch (err) {
        console.error("Failed to manage user access:", err);
        error.set(
          existingAccess
            ? "Failed to update user access. Please try again."
            : "Failed to send invitation. Please try again."
        );
      }
    },
    [selectedUser.get, permissions.get, storeId, existingAccess]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Card className="w-full max-w-md">
        <CardHeaderForPopup
          title={existingAccess ? "Edit User Access" : "Invite User to Store"}
        />
        <Line />

        <motion.div className="space-y-4 p-4" variants={fieldVariants}>
          {/* Error Display */}
          <AnimatePresence>
            {error.get && (
              <motion.div
                className="bg-red-700/20 mb-3 px-4 py-3 border border-red-300 rounded-lg"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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

          {/* User Search */}
          {!existingAccess && (
            <motion.div variants={fieldVariants}>
              <label className="block mb-2 font-medium text-sm">
                <Translate content="Search User" />
              </label>
              <div className="relative">
                {!selectedUser.get && (
                  <Field
                    inputName="user-search"
                    value={searchTerm.get}
                    onChange={(e) => {
                      searchTerm.set(e.target.value);
                      showDropdown.set(true);
                      if (selectedUser.get) {
                        selectedUser.set(null);
                      }
                    }}
                    placeholder="Search by name, email, or ID..."
                    className="rounded-2xl"
                  />
                )}
                {selectedUser.get && (
                  <div className="flex items-center gap-3 bg-[--biqpod-primary]/10 mt-2 p-3 border border-[--biqpod-primary]/30 rounded-lg">
                    <div className="flex justify-center items-center bg-[--biqpod-primary] rounded-full w-8 h-8 overflow-hidden font-bold text-[--biqpod-primary-content] text-sm">
                      {selectedUser.get.photo ? (
                        <img
                          src={selectedUser.get.photo}
                          alt={`${selectedUser.get.firstname} ${selectedUser.get.lastname}`}
                          className="rounded-full w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to first letter if image fails to load
                            const target = e.target as HTMLElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent && selectedUser.get) {
                              parent.textContent =
                                selectedUser.get.firstname?.[0] ||
                                selectedUser.get.email?.[0] ||
                                "?";
                            }
                          }}
                        />
                      ) : (
                        selectedUser.get.firstname?.[0] ||
                        selectedUser.get.email?.[0] ||
                        "?"
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[--biqpod-text-color]">
                        {selectedUser.get.firstname} {selectedUser.get.lastname}
                      </div>
                      <div className="text-sm">{selectedUser.get.email}</div>
                    </div>
                    <CircleTip
                      onClick={() => {
                        selectedUser.set(null);
                        searchTerm.set("");
                      }}
                      icon={allIcons.solid.faTimes}
                      className="hover:text-red-500"
                    />
                  </div>
                )}
                <AnimatePresence>
                  {showDropdown.get &&
                    searchTerm.get.length >= 1 &&
                    filteredUsers &&
                    filteredUsers.length > 0 &&
                    !selectedUser.get && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="right-0 bottom-full left-0 z-50 absolute bg-[--biqpod-primary-background] shadow-xl mb-1 border border-[--biqpod-borders] rounded-lg max-h-60 overflow-y-auto"
                      >
                        {filteredUsers.slice(0, 10).map((user: UserWithId) => (
                          <div
                            key={user.id}
                            className="hover:bg-[--biqpod-gray-opacity] p-3 border-[--biqpod-borders] border-b last:border-b-0 transition-colors duration-150 cursor-pointer"
                            onClick={() => {
                              selectedUser.set(user);
                              searchTerm.set(
                                `${user.firstname} ${user.lastname} (${user.email})`
                              );
                              showDropdown.set(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex justify-center items-center bg-[--biqpod-primary] rounded-full w-8 h-8 overflow-hidden font-bold text-[--biqpod-primary-content] text-sm">
                                {user.photo ? (
                                  <img
                                    src={user.photo}
                                    alt={`${user.firstname} ${user.lastname}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback to first letter if image fails to load
                                      const target = e.target as HTMLElement;
                                      target.style.display = "none";
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.textContent =
                                          user.firstname?.[0] ||
                                          user.email?.[0] ||
                                          "?";
                                      }
                                    }}
                                  />
                                ) : (
                                  user.firstname?.[0] || user.email?.[0] || "?"
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {highlightMatch(
                                    `${user.firstname || ""} ${
                                      user.lastname || ""
                                    }`.trim(),
                                    searchTerm.get || ""
                                  )}
                                </div>
                                <div className="text-sm">
                                  {highlightMatch(
                                    user.email || "",
                                    searchTerm.get || ""
                                  )}
                                </div>
                                {user.username && (
                                  <div className="text-xs">
                                    @
                                    {highlightMatch(
                                      user.username,
                                      searchTerm.get || ""
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  {showDropdown.get &&
                    searchTerm.get.length >= 1 &&
                    filteredUsers &&
                    filteredUsers.length === 0 &&
                    !selectedUser.get && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="right-0 bottom-full left-0 z-50 absolute bg-[--biqpod-primary-background] shadow-xl mb-1 p-3 border border-[--biqpod-borders] rounded-lg"
                      >
                        <div className="text-sm text-center">
                          <Translate content="No users found matching" /> "
                          {searchTerm.get}"
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
              {!existingAccess && (
                <motion.p
                  className="mt-1 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Translate content="Start typing to search for users by name, email, or ID" />
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Selected User Display for Existing Access */}
          {existingAccess && (
            <motion.div variants={fieldVariants}>
              <label className="block mb-2 font-medium text-sm">
                <Translate content="User" />
              </label>
              <div className="bg-[--biqpod-secondary-background] p-3 border border-[--biqpod-borders] rounded-lg">
                <div className="text-sm">
                  <AsyncComponent
                    deps={[existingAccess.relatedUid]}
                    render={async () => {
                      if (!existingAccess.relatedUid) {
                        return <EmptyComponent />;
                      }
                      const user = await snapbuyApi.friends.get(
                        existingAccess.relatedUid
                      );
                      return (
                        <EmptyComponent>
                          {user?.firstname || user?.email}
                        </EmptyComponent>
                      );
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Permission Level */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-medium text-sm">
              <Translate content="Permission Level" />
            </label>
            <EnumField
              state={permissions}
              id="user-access-permissions"
              config={{
                list: permissionOptions,
              }}
            />
            <motion.div
              className="space-y-1 mt-2 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <span className={`fas ${allIcons.solid.faEye.iconName} w-3`} />
                <span>
                  <strong>
                    <Translate content="Read Only:" />
                  </strong>{" "}
                  <Translate content="View products, orders, and store data" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`fas ${allIcons.solid.faPen.iconName} w-3`} />
                <span>
                  <strong>
                    <Translate content="Read & Edit:" />
                  </strong>{" "}
                  <Translate content="Full access to modify store data" />
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex items-center gap-3 pt-4"
            variants={fieldVariants}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex-1"
            >
              <Button
                onClick={() => {
                  closePopup();
                }}
                className="bg-[--biqpod-gray-opacity] w-full text-[--biqpod-text-color]"
              >
                <Translate content="Cancel" />
              </Button>
            </motion.div>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex-1"
            >
              <Button
                onClick={() => execAction("upsert-user-access")}
                disabled={isLoading(action)}
                className="w-full"
                icon={
                  isLoading(action)
                    ? allIcons.solid.faSpinner
                    : existingAccess
                    ? allIcons.solid.faPen
                    : allIcons.solid.faUserPlus
                }
              >
                {isLoading(action) ? (
                  <Translate content="Processing..." />
                ) : existingAccess ? (
                  <Translate content="Update Access" />
                ) : (
                  <Translate content="Invitation" />
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  );
};
