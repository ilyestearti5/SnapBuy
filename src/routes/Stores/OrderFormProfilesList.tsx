import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { showToast, showPopup } from "@biqpod/app/ui/hooks";
import {
  getAllOrderFormProfiles,
  deleteOrderFormProfile,
  duplicateOrderFormProfile,
  OrderFormProfile,
} from "../../apis/orderFormProfiles";
import { useStoreId } from "../../utils";
import { OrderFormProfileEditor } from "./OrderFormProfileEditor";
export const OrderFormProfilesList: React.FC = () => {
  const storeId = useStoreId();
  const [profiles, setProfiles] = useState<OrderFormProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Fetch profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!storeId) return;
      try {
        setIsLoading(true);
        const data = await getAllOrderFormProfiles(storeId);
        setProfiles(data);
      } catch (error) {
        showToast("Failed to load profiles", "error");
        setProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfiles();
  }, [storeId]);
  const handleCreateProfile = () => {
    showPopup(
      <OrderFormProfileEditor
        storeId={storeId!}
        onSave={() => {
          // Refresh profiles
          const refetch = async () => {
            const data = await getAllOrderFormProfiles(storeId!);
            setProfiles(data);
          };
          refetch();
        }}
      />
    );
  };
  const handleEditProfile = (profileToEdit: OrderFormProfile) => {
    showPopup(
      <OrderFormProfileEditor
        storeId={storeId!}
        profile={profileToEdit}
        onSave={() => {
          const refetch = async () => {
            const data = await getAllOrderFormProfiles(storeId!);
            setProfiles(data);
          };
          refetch();
        }}
      />
    );
  };
  const handleDuplicateProfile = async (profile: OrderFormProfile) => {
    if (!storeId) return;
    try {
      await duplicateOrderFormProfile(
        storeId,
        profile.id,
        `${profile.name} (Copy)`
      );
      showToast("Profile duplicated successfully", "success");
      const data = await getAllOrderFormProfiles(storeId);
      setProfiles(data);
    } catch (error) {
      showToast("Failed to duplicate profile", "error");
    }
  };
  const handleDeleteProfile = async (profileId: string) => {
    if (!storeId) return;
    try {
      await deleteOrderFormProfile(storeId, profileId);
      showToast("Profile deleted successfully", "success");
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (error) {
      showToast("Failed to delete profile", "error");
    }
  };
  const filteredProfiles = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (isLoading) {
    return (
      <Card className="w-full">
        <div className="flex justify-center items-center p-8">
          <Icon icon={allIcons.solid.faCircleNotch} className="animate-spin" />
        </div>
      </Card>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center items-center p-6 w-full min-h-screen"
    >
      <div className="space-y-6 w-full max-w-6xl">
        {/* Header Section - Improved Design */}
        <div className="bg-gradient-to-r from-[--biqpod-primary] to-[--biqpod-primary]/80 shadow-lg p-8 rounded-2xl text-white">
          <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-6">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="bg-white/20 backdrop-blur-sm p-4 rounded-xl"
              >
                <Icon
                  icon={allIcons.solid.faLayerGroup}
                  className="text-white text-3xl"
                />
              </motion.div>
              <div className="flex-1">
                <h1 className="mb-2 font-bold text-3xl">
                  <Translate content="order form profiles" />
                </h1>
                <p className="max-w-md text-white/90 text-sm">
                  <Translate content="create and manage reusable order form configurations" />
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleCreateProfile}
                icon={allIcons.solid.faPlus}
                className="bg-white shadow-lg hover:shadow-xl font-semibold text-[--biqpod-primary] transition-all"
              >
                <Translate content="new profile" />
              </Button>
            </motion.div>
          </div>
        </div>
        {/* Search Bar - Improved */}
        <Card className="shadow-md">
          <div className="p-4">
            <div className="flex items-center gap-3 bg-[--biqpod-background] px-4 py-3 border-2 border-transparent focus-within:border-[--biqpod-primary] rounded-xl transition-colors">
              <Icon
                icon={allIcons.solid.faSearch}
                className="text-[--biqpod-text-secondary]"
              />
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </Card>
        {/* Profiles Grid */}
        {filteredProfiles.length > 0 ? (
          <div className="gap-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredProfiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="flex flex-col shadow-md hover:shadow-xl border border-[--biqpod-border]/50 rounded-xl h-full overflow-hidden transition-all duration-300">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-[--biqpod-primary]/10 to-transparent p-5 border-[--biqpod-border] border-b">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[--biqpod-text-color] text-lg truncate">
                              {profile.name}
                            </h3>
                            {profile.isDefault && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-green-500/20 px-2 py-0.5 rounded-full font-semibold text-green-700 text-xs whitespace-nowrap"
                              >
                                ✓ <Translate content="default" />
                              </motion.span>
                            )}
                          </div>
                          {profile.description && (
                            <p className="text-[--biqpod-text-secondary] text-xs truncate line-clamp-2">
                              {profile.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Profile Settings Summary */}
                    <Scroll className="flex-1">
                      <div className="space-y-3 p-5">
                        {/* Feature Checklist */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon
                              icon={
                                profile.allowQuantityControl
                                  ? allIcons.solid.faCheckCircle
                                  : allIcons.solid.faCircle
                              }
                              className={tw(
                                profile.allowQuantityControl
                                  ? "text-green-500"
                                  : "text-gray-300"
                              )}
                            />
                            <span
                              className={
                                profile.allowQuantityControl
                                  ? "text-[--biqpod-text-color]"
                                  : "text-[--biqpod-text-secondary]"
                              }
                            >
                              <Translate content="quantity control" />
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Icon
                              icon={
                                profile.requireBuyerNotes
                                  ? allIcons.solid.faCheckCircle
                                  : allIcons.solid.faCircle
                              }
                              className={tw(
                                profile.requireBuyerNotes
                                  ? "text-green-500"
                                  : "text-gray-300"
                              )}
                            />
                            <span
                              className={
                                profile.requireBuyerNotes
                                  ? "text-[--biqpod-text-color]"
                                  : "text-[--biqpod-text-secondary]"
                              }
                            >
                              <Translate content="buyer notes" />
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Icon
                              icon={
                                profile.allowMultipleProducts
                                  ? allIcons.solid.faCheckCircle
                                  : allIcons.solid.faCircle
                              }
                              className={tw(
                                profile.allowMultipleProducts
                                  ? "text-green-500"
                                  : "text-gray-300"
                              )}
                            />
                            <span
                              className={
                                profile.allowMultipleProducts
                                  ? "text-[--biqpod-text-color]"
                                  : "text-[--biqpod-text-secondary]"
                              }
                            >
                              <Translate content="multiple products" />
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Icon
                              icon={
                                profile.showProductImages
                                  ? allIcons.solid.faCheckCircle
                                  : allIcons.solid.faCircle
                              }
                              className={tw(
                                profile.showProductImages
                                  ? "text-green-500"
                                  : "text-gray-300"
                              )}
                            />
                            <span
                              className={
                                profile.showProductImages
                                  ? "text-[--biqpod-text-color]"
                                  : "text-[--biqpod-text-secondary]"
                              }
                            >
                              <Translate content="show images" />
                            </span>
                          </div>
                        </div>
                        <div className="my-2">
                          <Line />
                        </div>
                        {/* Metadata */}
                        <div className="space-y-1 text-[--biqpod-text-secondary] text-xs">
                          <p>
                            Created:{" "}
                            <span className="font-medium text-[--biqpod-text-color]">
                              {new Date(profile.createdAt).toLocaleDateString()}
                            </span>
                          </p>
                          {profile.usageCount ? (
                            <p className="bg-[--biqpod-primary]/10 px-2 py-1 rounded font-semibold text-[--biqpod-primary]">
                              📦 {profile.usageCount} products
                            </p>
                          ) : (
                            <p className="text-gray-400">
                              No products assigned yet
                            </p>
                          )}
                        </div>
                      </div>
                    </Scroll>
                    {/* Actions */}
                    <div className="flex gap-2 bg-[--biqpod-background]/50 p-3 border-[--biqpod-border] border-t">
                      <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => handleEditProfile(profile)}
                          icon={allIcons.solid.faEdit}
                          className="bg-blue-500/20 hover:bg-blue-500/30 w-full font-medium text-blue-600 text-sm"
                        >
                          <Translate content="edit" />
                        </Button>
                      </motion.div>
                      <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => handleDuplicateProfile(profile)}
                          icon={allIcons.solid.faCopy}
                          className="bg-purple-500/20 hover:bg-purple-500/30 w-full font-medium text-purple-600 text-sm"
                        >
                          <Translate content="duplicate" />
                        </Button>
                      </motion.div>
                      <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this profile?"
                              )
                            ) {
                              handleDeleteProfile(profile.id);
                            }
                          }}
                          icon={allIcons.solid.faTrash}
                          className="bg-red-500/20 hover:bg-red-500/30 w-full font-medium text-red-600 text-sm"
                          disabled={profile.isDefault}
                        >
                          <Translate content="delete" />
                        </Button>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-[--biqpod-primary]/5 to-transparent p-16 border-[--biqpod-border] border-2 border-dashed rounded-2xl text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-6"
              >
                <Icon
                  icon={allIcons.solid.faLayerGroup}
                  className="mx-auto text-[--biqpod-primary]/30 text-7xl"
                />
              </motion.div>
              <div className="mx-auto max-w-md">
                <h3 className="mb-2 font-bold text-[--biqpod-text-color] text-2xl">
                  {searchQuery ? (
                    <Translate content="no profiles found" />
                  ) : (
                    <>No Profiles Yet</>
                  )}
                </h3>
                <p className="mb-8 text-[--biqpod-text-secondary]">
                  {searchQuery ? (
                    <Translate content="no profiles match your search" />
                  ) : (
                    <>
                      Create your first order form profile to get started with
                      custom checkout configurations
                    </>
                  )}
                </p>
              </div>
              {!searchQuery && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleCreateProfile}
                    icon={allIcons.solid.faPlus}
                    className="bg-gradient-to-r from-[--biqpod-primary] to-[--biqpod-primary]/80 shadow-lg hover:shadow-xl font-semibold text-white transition-all"
                  >
                    <Translate content="create profile" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
