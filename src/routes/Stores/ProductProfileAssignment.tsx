import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CircleLoading,
  EmptyComponent,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { showToast, closePopup } from "@biqpod/app/ui/hooks";
import {
  getAllOrderFormProfiles,
  getProductOrderFormProfile,
  assignProfileToProduct,
  OrderFormProfile,
} from "../../apis/orderFormProfiles";
import { useStoreId } from "../../utils";

interface ProductProfileAssignmentProps {
  productId: string;
  productName?: string;
  onSave?: () => void;
}

export const ProductProfileAssignment: React.FC<
  ProductProfileAssignmentProps
> = ({ productId, productName, onSave }) => {
  const storeId = useStoreId();
  const [profiles, setProfiles] = useState<OrderFormProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profiles and current assignment
  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      try {
        setIsLoading(true);
        const [profilesList, currentProfile] = await Promise.all([
          getAllOrderFormProfiles(storeId),
          getProductOrderFormProfile(productId, storeId),
        ]);

        setProfiles(profilesList);
        if (currentProfile?.id) {
          setSelectedProfileId(currentProfile.id);
        } else if (profilesList.length > 0) {
          setSelectedProfileId(profilesList[0].id);
        }
      } catch (error) {
        showToast("Failed to load profiles", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId, productId]);

  const saveAction = async () => {
    if (!selectedProfileId) {
      showToast("Please select a profile", "error");
      return;
    }

    try {
      await assignProfileToProduct(productId, selectedProfileId);
      showToast("Profile assigned successfully", "success");
      onSave?.();
      closePopup();
    } catch (error) {
      showToast("Failed to assign profile", "error");
    }
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <div className="flex justify-center items-center p-8">
          <CircleLoading />
        </div>
      </Card>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card className="w-full max-w-2xl">
        <div className="p-8 text-center">
          <Icon
            icon={allIcons.solid.faLayerGroup}
            className="text-[--biqpod-gray-opacity-2] mx-auto mb-4 text-6xl"
          />
          <h3 className="mb-2 font-semibold text-xl">
            <Translate content="no profiles available" />
          </h3>
          <p className="mb-4 text-[--biqpod-text-secondary]">
            <Translate content="create order form profiles first" />
          </p>
          <Button
            onClick={() => closePopup()}
            icon={allIcons.solid.faXmark}
            className="bg-[--biqpod-gray-opacity]"
          >
            <Translate content="close" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl"
    >
      <Card>
        {/* Header */}
        <div className="p-6 border-[--biqpod-border] border-b">
          <div className="flex items-center gap-3">
            <Icon
              icon={allIcons.solid.faLink}
              className="text-[--biqpod-primary] text-2xl"
            />
            <div>
              <h2 className="font-bold text-2xl">
                <Translate content="assign order form profile" />
              </h2>
              {productName && (
                <p className="mt-1 text-[--biqpod-text-secondary] text-sm">
                  <Translate content="for product" />: {productName}
                </p>
              )}
            </div>
          </div>
        </div>

        <Scroll className="max-h-[60vh]">
          <div className="space-y-4 p-6">
            <AnimatePresence>
              {profiles.map((profile, index) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={tw(
                    "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                    selectedProfileId === profile.id
                      ? "border-[--biqpod-primary] bg-[--biqpod-primary-background]"
                      : "border-[--biqpod-border] hover:border-[--biqpod-primary-opacity]"
                  )}
                >
                  {/* Selection indicator */}
                  <div className="top-3 right-3 absolute">
                    <motion.div
                      className={tw(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        selectedProfileId === profile.id
                          ? "bg-[--biqpod-primary] border-[--biqpod-primary]"
                          : "border-[--biqpod-border] hover:border-[--biqpod-primary]"
                      )}
                    >
                      {selectedProfileId === profile.id && (
                        <Icon
                          icon={allIcons.solid.faCheck}
                          className="text-[--biqpod-primary-content] text-sm"
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Profile Header */}
                  <div className="mb-3 pr-8">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{profile.name}</h3>
                      {profile.isDefault && (
                        <span className="bg-blue-600 px-2 py-1 rounded font-semibold text-white text-xs">
                          <Translate content="default" />
                        </span>
                      )}
                    </div>
                    {profile.description && (
                      <p className="mt-1 text-[--biqpod-text-secondary] text-sm">
                        {profile.description}
                      </p>
                    )}
                  </div>

                  {/* Profile Features Grid */}
                  <div className="gap-2 grid grid-cols-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={
                          profile.allowQuantityControl
                            ? allIcons.solid.faCheckCircle
                            : allIcons.solid.faTimesCircle
                        }
                        className={tw(
                          profile.allowQuantityControl
                            ? "text-green-600"
                            : "text-gray-400"
                        )}
                      />
                      <span>
                        <Translate content="quantity control" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon
                        icon={
                          profile.requireBuyerNotes
                            ? allIcons.solid.faCheckCircle
                            : allIcons.solid.faTimesCircle
                        }
                        className={tw(
                          profile.requireBuyerNotes
                            ? "text-green-600"
                            : "text-gray-400"
                        )}
                      />
                      <span>
                        <Translate content="buyer notes" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon
                        icon={
                          profile.showProductImages
                            ? allIcons.solid.faCheckCircle
                            : allIcons.solid.faTimesCircle
                        }
                        className={tw(
                          profile.showProductImages
                            ? "text-green-600"
                            : "text-gray-400"
                        )}
                      />
                      <span>
                        <Translate content="show images" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon
                        icon={
                          profile.allowMultipleProducts
                            ? allIcons.solid.faCheckCircle
                            : allIcons.solid.faTimesCircle
                        }
                        className={tw(
                          profile.allowMultipleProducts
                            ? "text-green-600"
                            : "text-gray-400"
                        )}
                      />
                      <span>
                        <Translate content="multiple products" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Scroll>

        {/* Selected Profile Preview */}
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[--biqpod-background-secondary] p-6 border-[--biqpod-border] border-t"
          >
            <h4 className="flex items-center gap-2 mb-3 font-semibold">
              <Icon icon={allIcons.solid.faEye} />
              <Translate content="profile summary" />
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>
                  <Translate content="quantity control" />:
                </span>
                <span className="font-semibold">
                  {selectedProfile.allowQuantityControl ? (
                    <span className="text-green-600">
                      <Translate content="enabled" />
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      <Translate content="disabled (1 per order)" />
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  <Translate content="buyer notes" />:
                </span>
                <span className="font-semibold">
                  {selectedProfile.requireBuyerNotes ? (
                    <span className="text-green-600">
                      <Translate content="required" />
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      <Translate content="optional" />
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>
                  <Translate content="max note length" />:
                </span>
                <span className="font-semibold">
                  {selectedProfile.maxNotesLength}
                  <Translate content=" characters" />
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <EmptyComponent>
          <Line />
          <div className="flex justify-end gap-2 p-4">
            <Button
              onClick={() => closePopup()}
              icon={allIcons.solid.faXmark}
              className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
            >
              <Translate content="cancel" />
            </Button>
            <Button
              onClick={() => saveAction()}
              icon={allIcons.solid.faCheckCircle}
              className="bg-[--biqpod-success] text-[--biqpod-primary-content]"
            >
              <Translate content="assign profile" />
            </Button>
          </div>
        </EmptyComponent>
      </Card>
    </motion.div>
  );
};
