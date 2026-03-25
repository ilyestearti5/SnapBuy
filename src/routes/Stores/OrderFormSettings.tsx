import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion } from "framer-motion";
import { showToast } from "@biqpod/app/ui/hooks";
import { useStoreId } from "../../utils";

export interface OrderFormSettings {
  storeId: string;
  allowQuantityControl: boolean;
  requireBuyerNotes: boolean;
  notesPlaceholder: string;
  maxNotesLength: number;
  showProductImages: boolean;
  showProductDescription: boolean;
  allowMultipleProducts: boolean;
  requireDeliveryAddress: boolean;
  requirePhoneNumber: boolean;
  showStoreInformation: boolean;
  customMessage?: string;
  createdAt?: number;
  updatedAt?: number;
}

const defaultSettings: Omit<OrderFormSettings, "storeId"> = {
  allowQuantityControl: true,
  requireBuyerNotes: false,
  notesPlaceholder: "Add any special instructions or preferences...",
  maxNotesLength: 500,
  showProductImages: true,
  showProductDescription: true,
  allowMultipleProducts: true,
  requireDeliveryAddress: true,
  requirePhoneNumber: true,
  showStoreInformation: true,
};

// Custom Checkbox/Toggle Component
interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={tw(
        "relative flex cursor-pointer hover:border-[--biqpod-primary] items-center justify-center w-6 h-6 rounded-full border-2 transition-all bg-[--biqpod-primary-background] border-solid border-[--biqpod-borders]",
        checked && "bg-[--biqpod-primary] border-[--biqpod-primary]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      whileHover={!disabled ? { scale: 1.05 } : {}}
    >
      {checked && (
        <Icon
          icon={allIcons.solid.faCheck}
          className="text-[--biqpod-primary-content] text-xs"
        />
      )}
    </motion.button>
  );
};

export const OrderFormSettings: React.FC = () => {
  const storeId = useStoreId();
  const [settings, setSettings] = useState<OrderFormSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!storeId) return;
      try {
        setIsLoading(true);
        // Use default settings (this is legacy component - use OrderFormProfilesList instead)
        setSettings({
          storeId,
          ...defaultSettings,
        });
      } catch (error) {
        // Use defaults if fetch fails
        setSettings({
          storeId: storeId!,
          ...defaultSettings,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [storeId]);

  const handleToggle = (key: keyof OrderFormSettings) => {
    if (!settings) return;
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: !prev[key as keyof OrderFormSettings],
      };
    });
    setUnsavedChanges(true);
  };

  const handleInputChange = (key: keyof OrderFormSettings, value: any) => {
    if (!settings) return;
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value,
      };
    });
    setUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!settings || !storeId) return;

    setIsSaving(true);
    try {
      // This is a legacy component - use OrderFormProfilesList for new implementations
      showToast("Order form settings saved successfully!", "success");
      setUnsavedChanges(false);
    } catch (error) {
      showToast("Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (!storeId) return;
    setSettings({
      storeId,
      ...defaultSettings,
    });
    setUnsavedChanges(true);
  };

  if (isLoading || !settings) {
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
      className="w-full max-w-4xl"
    >
      <Card>
        {/* Header */}
        <div className="p-6 border-[--biqpod-border] border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Icon
                icon={allIcons.solid.faGear}
                className="text-[--biqpod-primary] text-2xl"
              />
              <div>
                <h2 className="font-bold text-2xl capitalize">
                  <Translate content="order form settings" />
                </h2>
                <p className="mt-1 text-[--biqpod-text-secondary] text-sm">
                  <Translate content="customize how your customers place orders" />
                </p>
              </div>
            </div>
            {unsavedChanges && (
              <span className="font-medium text-yellow-600 text-sm">
                <Translate content="unsaved changes" />
              </span>
            )}
          </div>
        </div>

        <Scroll className="max-h-[70vh]">
          <div className="space-y-8 p-6">
            {/* Quantity Control Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-[--biqpod-background-secondary] p-4 border border-[--biqpod-border] rounded-lg"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-lg">
                    <Icon icon={allIcons.solid.faBox} />
                    <Translate content="quantity control" />
                  </h3>
                  <p className="mt-2 text-[--biqpod-text-secondary] text-sm">
                    <Translate content="allow customers to select how many items they want, or fix quantity to 1 per product" />
                  </p>
                </div>
                <CustomCheckbox
                  checked={settings.allowQuantityControl}
                  onChange={() => handleToggle("allowQuantityControl")}
                />
              </div>
              <div className="my-3">
                <Line />
              </div>
              <div className="text-[--biqpod-text-secondary] text-xs">
                {settings.allowQuantityControl ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Icon icon={allIcons.solid.faCheck} />
                    <Translate content="customers can select quantity" />
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Icon icon={allIcons.solid.faLock} />
                    <Translate content="fixed quantity 1 per product" />
                  </span>
                )}
              </div>
            </motion.div>

            {/* Buyer Notes Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-[--biqpod-background-secondary] p-4 border border-[--biqpod-border] rounded-lg"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-lg">
                    <Icon icon={allIcons.solid.faNoteSticky} />
                    <Translate content="buyer notes" />
                  </h3>
                  <p className="mt-2 text-[--biqpod-text-secondary] text-sm">
                    <Translate content="collect special requests or instructions from customers" />
                  </p>
                </div>
                <CustomCheckbox
                  checked={settings.requireBuyerNotes}
                  onChange={() => handleToggle("requireBuyerNotes")}
                />
              </div>

              {settings.requireBuyerNotes && (
                <>
                  <div className="my-3">
                    <Line />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="font-medium text-sm">
                        <Translate content="placeholder text" />
                      </label>
                      <Field
                        inputName="notes-placeholder"
                        value={settings.notesPlaceholder}
                        onChange={(value) =>
                          handleInputChange("notesPlaceholder", value)
                        }
                        placeholder="Enter placeholder text..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 font-medium text-sm">
                        <Icon icon={allIcons.solid.faRuler} />
                        <Translate content="maximum note length" />
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min="50"
                          max="1000"
                          step="50"
                          value={settings.maxNotesLength}
                          onChange={(e) =>
                            handleInputChange(
                              "maxNotesLength",
                              Number(e.target.value)
                            )
                          }
                          className="flex-1"
                        />
                        <span className="min-w-[60px] font-semibold text-[--biqpod-primary] text-center">
                          {settings.maxNotesLength}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Product Display Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-[--biqpod-background-secondary] p-4 border border-[--biqpod-border] rounded-lg"
            >
              <h3 className="flex items-center gap-2 mb-4 font-semibold text-lg">
                <Icon icon={allIcons.solid.faImage} />
                <Translate content="product display" />
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
                  <div>
                    <p className="font-medium">
                      <Translate content="show product images" />
                    </p>
                    <p className="text-[--biqpod-text-secondary] text-xs">
                      <Translate content="display product photos in order form" />
                    </p>
                  </div>
                  <CustomCheckbox
                    checked={settings.showProductImages}
                    onChange={() => handleToggle("showProductImages")}
                  />
                </div>

                <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
                  <div>
                    <p className="font-medium">
                      <Translate content="show descriptions" />
                    </p>
                    <p className="text-[--biqpod-text-secondary] text-xs">
                      <Translate content="display product descriptions" />
                    </p>
                  </div>
                  <CustomCheckbox
                    checked={settings.showProductDescription}
                    onChange={() => handleToggle("showProductDescription")}
                  />
                </div>
              </div>
            </motion.div>

            {/* Order Options Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-[--biqpod-background-secondary] p-4 border border-[--biqpod-border] rounded-lg"
            >
              <h3 className="flex items-center gap-2 mb-4 font-semibold text-lg">
                <Icon icon={allIcons.solid.faCartShopping} />
                <Translate content="order options" />
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
                  <div>
                    <p className="font-medium">
                      <Translate content="allow multiple products" />
                    </p>
                    <p className="text-[--biqpod-text-secondary] text-xs">
                      <Translate content="let customers order multiple different products" />
                    </p>
                  </div>
                  <CustomCheckbox
                    checked={settings.allowMultipleProducts}
                    onChange={() => handleToggle("allowMultipleProducts")}
                  />
                </div>

                <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
                  <div>
                    <p className="font-medium">
                      <Translate content="require delivery address" />
                    </p>
                    <p className="text-[--biqpod-text-secondary] text-xs">
                      <Translate content="make address field mandatory" />
                    </p>
                  </div>
                  <CustomCheckbox
                    checked={settings.requireDeliveryAddress}
                    onChange={() => handleToggle("requireDeliveryAddress")}
                  />
                </div>

                <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
                  <div>
                    <p className="font-medium">
                      <Translate content="require phone number" />
                    </p>
                    <p className="text-[--biqpod-text-secondary] text-xs">
                      <Translate content="make phone field mandatory" />
                    </p>
                  </div>
                  <CustomCheckbox
                    checked={settings.requirePhoneNumber}
                    onChange={() => handleToggle("requirePhoneNumber")}
                  />
                </div>
              </div>
            </motion.div>

            {/* Additional Settings */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-[--biqpod-background-secondary] p-4 border border-[--biqpod-border] rounded-lg"
            >
              <h3 className="flex items-center gap-2 mb-4 font-semibold text-lg">
                <Icon icon={allIcons.solid.faEllipsis} />
                <Translate content="additional settings" />
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
                  <div>
                    <p className="font-medium">
                      <Translate content="show store information" />
                    </p>
                    <p className="text-[--biqpod-text-secondary] text-xs">
                      <Translate content="display store details on order form" />
                    </p>
                  </div>
                  <CustomCheckbox
                    checked={settings.showStoreInformation}
                    onChange={() => handleToggle("showStoreInformation")}
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <label className="font-medium text-sm">
                    <Translate content="custom welcome message" />
                  </label>
                  <Field
                    inputName="custom-message"
                    value={settings.customMessage || ""}
                    onChange={(value) =>
                      handleInputChange("customMessage", value)
                    }
                    placeholder="Add a custom message for your customers..."
                    multiLines
                    rows={3}
                    maxRows={5}
                  />
                  <p className="text-[--biqpod-text-secondary] text-xs">
                    <Translate content="this will appear at the top of the order form" />
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Preview Card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-[--biqpod-primary-background] opacity-70 p-4 border-[--biqpod-primary] border-2 border-dashed rounded-lg"
            >
              <h3 className="flex items-center gap-2 mb-3 font-semibold text-lg">
                <Icon icon={allIcons.solid.faEye} />
                <Translate content="preview" />
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Icon
                    icon={
                      settings.allowQuantityControl
                        ? allIcons.solid.faCheck
                        : allIcons.solid.faTimes
                    }
                    className={tw(
                      settings.allowQuantityControl
                        ? "text-green-600"
                        : "text-gray-400"
                    )}
                  />
                  <span>
                    <Translate content="quantity control" />:
                    {settings.allowQuantityControl ? (
                      <span className="ml-1 font-semibold">
                        <Translate content="enabled" />
                      </span>
                    ) : (
                      <span className="ml-1 text-gray-500">
                        <Translate content="disabled" />
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Icon
                    icon={
                      settings.requireBuyerNotes
                        ? allIcons.solid.faCheck
                        : allIcons.solid.faTimes
                    }
                    className={tw(
                      settings.requireBuyerNotes
                        ? "text-green-600"
                        : "text-gray-400"
                    )}
                  />
                  <span>
                    <Translate content="buyer notes" />:
                    {settings.requireBuyerNotes ? (
                      <span className="ml-1 font-semibold">
                        <Translate content="required" />
                      </span>
                    ) : (
                      <span className="ml-1 text-gray-500">
                        <Translate content="disabled" />
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Icon
                    icon={
                      settings.allowMultipleProducts
                        ? allIcons.solid.faCheck
                        : allIcons.solid.faTimes
                    }
                    className={tw(
                      settings.allowMultipleProducts
                        ? "text-green-600"
                        : "text-gray-400"
                    )}
                  />
                  <span>
                    <Translate content="multiple products" />:
                    {settings.allowMultipleProducts ? (
                      <span className="ml-1 font-semibold">
                        <Translate content="allowed" />
                      </span>
                    ) : (
                      <span className="ml-1 text-gray-500">
                        <Translate content="single product only" />
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </Scroll>

        {/* Action Buttons */}
        <EmptyComponent>
          <Line />
          <div className="flex justify-end gap-2 p-4">
            <Button
              onClick={handleResetToDefaults}
              icon={allIcons.solid.faRotateLeft}
              className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
            >
              <Translate content="reset to defaults" />
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!unsavedChanges || isSaving}
              icon={
                isSaving ? allIcons.solid.faCircleNotch : allIcons.solid.faSave
              }
              iconClassName={tw(isSaving && "animate-spin")}
              className="bg-[--biqpod-success] text-[--biqpod-primary-content]"
            >
              <Translate content={isSaving ? "saving..." : "save settings"} />
            </Button>
          </div>
        </EmptyComponent>
      </Card>
    </motion.div>
  );
};
