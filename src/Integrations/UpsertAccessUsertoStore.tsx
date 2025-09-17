import {
  Button,
  Card,
  CardHeaderForPopup,
  EnumField,
  Field,
  Line,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  isLoading,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { snapbuyApi } from "../apis";
import { allIcons } from "@biqpod/app/ui/apis";

interface UpsertAccessUsertoStoreProps {
  storeId: string;
  existingAccess?: SnapBuy.StoreUserAccess;
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
  const identifierType = useCopyState<string | false | 0 | null | undefined>(
    existingAccess?.userEmail
      ? "email"
      : existingAccess?.username
      ? "username"
      : "email"
  );
  const userIdentifier = useCopyState<string>(
    existingAccess?.userEmail || existingAccess?.username || ""
  );
  const permissions = useCopyState<string | false | 0 | null | undefined>(
    existingAccess?.permissions || "read"
  );

  const identifierOptions = [
    { value: "email", content: "Email Address" },
    { value: "username", content: "Username" },
  ];

  const permissionOptions = [
    { value: "read", content: "Read Only" },
    { value: "edit", content: "Read & Edit" },
  ];

  const action = useAction(
    "upsert-user-access",
    async () => {
      error.set(null);

      if (!userIdentifier.get?.trim()) {
        error.set(
          `${identifierType.get === "email" ? "Email" : "Username"} is required`
        );
        return;
      }

      if (!permissions.get) {
        error.set("Permission level is required");
        return;
      }

      // Validate email format if type is email
      if (identifierType.get === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userIdentifier.get.trim())) {
          error.set("Please enter a valid email address");
          return;
        }
      }

      // Validate username format if type is username
      if (identifierType.get === "username") {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(userIdentifier.get.trim())) {
          error.set(
            "Username must be 3-20 characters and contain only letters, numbers, and underscores"
          );
          return;
        }
      }

      try {
        if (existingAccess) {
          // Update existing access
          await snapbuyApi.updateUserAccessToStore(existingAccess.id, {
            permissions: permissions.get as "read" | "edit",
          });
          showToast("User access updated successfully", "success");
        } else {
          // Add new access
          const accessData = {
            permissions: permissions.get as "read" | "edit",
          } as any;

          if (identifierType.get === "email") {
            accessData.email = userIdentifier.get.trim();
          } else {
            accessData.username = userIdentifier.get.trim();
          }

          await snapbuyApi.addUserAccessToStore(storeId, accessData);
          showToast("User access invitation sent successfully", "success");
        }

        // Clear form
        userIdentifier.set("");
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
    [
      userIdentifier.get,
      permissions.get,
      identifierType.get,
      storeId,
      existingAccess,
    ]
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

          {/* Identifier Type Selection */}
          {!existingAccess && (
            <motion.div variants={fieldVariants}>
              <label className="block mb-2 font-medium text-sm">
                Identification Type
              </label>
              <EnumField
                state={identifierType}
                id="user-access-identifier-type"
                config={{
                  list: identifierOptions,
                }}
              />
            </motion.div>
          )}

          {/* Email/Username Input */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-medium text-sm">
              {identifierType.get === "username" ? "Username" : "Email Address"}
            </label>
            <Field
              inputName="user-identifier"
              value={userIdentifier.get || ""}
              onChange={(e) => userIdentifier.set(e.target.value)}
              placeholder={
                identifierType.get === "username"
                  ? "username123"
                  : "user@example.com"
              }
              disabled={!!existingAccess}
              className="rounded-2xl"
            />
            {existingAccess && (
              <motion.p
                className="mt-1 text-gray-500 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {identifierType.get === "username" ? "Username" : "Email"}{" "}
                cannot be changed for existing access
              </motion.p>
            )}
            {!existingAccess && identifierType.get === "username" && (
              <motion.p
                className="mt-1 text-gray-500 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Username must be 3-20 characters and contain only letters,
                numbers, and underscores
              </motion.p>
            )}
          </motion.div>

          {/* Permission Level */}
          <motion.div variants={fieldVariants}>
            <label className="block mb-2 font-medium text-sm">
              Permission Level
            </label>
            <EnumField
              state={permissions}
              id="user-access-permissions"
              config={{
                list: permissionOptions,
              }}
            />
            <motion.div
              className="space-y-1 mt-2 text-gray-600 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <span className={`fas ${allIcons.solid.faEye.iconName} w-3`} />
                <span>
                  <strong>Read Only:</strong> View products, orders, and store
                  data
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`fas ${allIcons.solid.faPen.iconName} w-3`} />
                <span>
                  <strong>Read & Edit:</strong> Full access to modify store data
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex gap-3 pt-4"
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
                onClick={closePopup}
                className="bg-gray-100 hover:bg-gray-200 w-full text-gray-700"
              >
                Cancel
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
                {isLoading(action)
                  ? "Processing..."
                  : existingAccess
                  ? "Update Access"
                  : "Send Invitation"}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  );
};
