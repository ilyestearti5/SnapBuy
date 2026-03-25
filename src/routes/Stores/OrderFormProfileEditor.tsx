import React from "react";
import {
  Button,
  Card,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
  BooleanField,
  CardHeaderForPopup,
  IconProps,
  CircleTip,
} from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
import { allIcons } from "@biqpod/app/ui/apis";
import { AnimatePresence, motion } from "framer-motion";
import { showToast, closePopup, useCopyState } from "@biqpod/app/ui/hooks";
import {
  createOrderFormProfile,
  updateOrderFormProfile,
  OrderFormProfile,
} from "../../apis/orderFormProfiles";
interface OrderFormProfileEditorProps {
  storeId: string;
  profile?: OrderFormProfile;
  onSave?: () => void;
}
interface SectionProps {
  title: string;
  icon?: IconProps["icon"];
  children?: any;
}
const Section = ({ icon, title, children }: SectionProps) => {
  const expand = useCopyState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-[--biqpod-background-secondary] border border-[--biqpod-border] rounded-lg"
    >
      <div
        onClick={() => {
          expand.set((s) => !s);
        }}
        className="flex justify-between items-center gap-2 hover:bg-[--biqpod-gray-opacity] active:bg-[--biqpod-gray-opacity-2] p-3 font-semibold text-lg capitalize cursor-pointer"
      >
        <h3 className="flex items-center gap-2">
          <Icon icon={icon} />
          <span>
            <Translate content={title} />
          </span>
        </h3>
        <CircleTip
          icon={allIcons.solid.faChevronDown}
          iconClassName={tw(
            "transition-transform duration-500",
            expand.get && "rotate-180"
          )}
        />
      </div>
      <Line />
      <AnimatePresence>
        {expand.get && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-3">{children}</div>
            <Line />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export const Required = () => <span className="text-red-500">*</span>;
export const OrderFormProfileEditor: React.FC<OrderFormProfileEditorProps> = ({
  storeId,
  profile,
  onSave,
}) => {
  // Form fields
  const [formData, setFormData] = React.useState<Partial<OrderFormProfile>>({
    name: profile?.name || "",
    description: profile?.description || "",
    notesPlaceholder:
      profile?.notesPlaceholder ||
      "Add any special instructions or preferences...",
    maxNotesLength: profile?.maxNotesLength ?? 500,
    customMessage: profile?.customMessage || "",
  });
  // Boolean fields using useCopyState
  const allowQuantityControl = useCopyState<null | undefined | boolean>(
    profile?.allowQuantityControl ?? true
  );
  const requireBuyerNotes = useCopyState<null | undefined | boolean>(
    profile?.requireBuyerNotes ?? false
  );
  const showProductImages = useCopyState<null | undefined | boolean>(
    profile?.showProductImages ?? true
  );
  const showProductDescription = useCopyState<null | undefined | boolean>(
    profile?.showProductDescription ?? true
  );
  const allowMultipleProducts = useCopyState<null | undefined | boolean>(
    profile?.allowMultipleProducts ?? true
  );
  const requireDeliveryAddress = useCopyState<null | undefined | boolean>(
    profile?.requireDeliveryAddress ?? true
  );
  const requirePhoneNumber = useCopyState<null | undefined | boolean>(
    profile?.requirePhoneNumber ?? true
  );
  const showStoreInformation = useCopyState<null | undefined | boolean>(
    profile?.showStoreInformation ?? true
  );
  const isDefault = useCopyState<null | undefined | boolean>(
    profile?.isDefault ?? false
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const handleSave = async () => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Profile name is required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("Please fix the errors", "error");
      return;
    }
    try {
      const fullProfileData: Partial<OrderFormProfile> = {
        ...formData,
        allowQuantityControl: !!allowQuantityControl.get,
        requireBuyerNotes: !!requireBuyerNotes.get,
        showProductImages: !!showProductImages.get,
        showProductDescription: !!showProductDescription.get,
        allowMultipleProducts: !!allowMultipleProducts.get,
        requireDeliveryAddress: !!requireDeliveryAddress.get,
        requirePhoneNumber: !!requirePhoneNumber.get,
        showStoreInformation: !!showStoreInformation.get,
        isDefault: !!isDefault.get,
      };
      if (profile?.id) {
        // Update existing
        await updateOrderFormProfile(storeId, profile.id, fullProfileData);
        showToast("Profile updated successfully", "success");
      } else {
        // Create new
        await createOrderFormProfile(storeId, fullProfileData as any);
        showToast("Profile created successfully", "success");
      }
      onSave?.();
      closePopup();
    } catch (error) {
      showToast("Failed to save profile", "error");
    }
  };
  const handleInputChange = (key: keyof OrderFormProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl"
    >
      <Card>
        {/* Header */}
        <CardHeaderForPopup
          title={profile ? "edit profile" : "create profile"}
        />
        <Line />
        <Scroll className="max-h-[70vh]">
          {/* Basic Info Section */}
          <Section icon={allIcons.solid.faInfo} title="basic information">
            <div>
              <label className="font-medium text-sm">
                <Translate content="profile name" /> <Required />
              </label>
              <Field
                inputName="profile-name"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
                placeholder="e.g., Quick Purchase, Detailed Order"
                className={tw(errors.name && "border-red-600")}
              />
              {errors.name && (
                <p className="mt-1 text-red-600 text-xs">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="font-medium text-sm">
                <Translate content="description" />
              </label>
              <Field
                inputName="profile-description"
                value={formData.description}
                onChange={(value) => handleInputChange("description", value)}
                placeholder="Describe this profile's purpose..."
                multiLines
                rows={2}
                maxRows={3}
              />
            </div>
            <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
              <div>
                <p className="font-medium text-sm">
                  <Translate content="set as store default" />
                </p>
                <p className="text-[--biqpod-text-secondary] text-xs">
                  <Translate content="use this profile for all products by default" />
                </p>
              </div>
              <BooleanField state={isDefault} id="profile-is-default" />
            </div>
          </Section>
          {/* Quantity Control Section */}
          <Section title="quantity control" icon={allIcons.solid.faBox}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <p className="font-medium">
                  <Translate content="allow quantity control" />
                </p>
                <p className="mt-1 text-[--biqpod-text-secondary] text-sm">
                  <Translate content="customers can select how many items (disabled = 1 item only)" />
                </p>
              </div>
              <BooleanField
                state={allowQuantityControl}
                id="quantity-control"
              />
            </div>
          </Section>
          {/* Buyer Notes Section */}
          <Section title="buyer notes" icon={allIcons.solid.faNoteSticky}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <p className="font-medium">
                  <Translate content="show buyer notes" />
                </p>
                <p className="mt-1 text-[--biqpod-text-secondary] text-sm">
                  <Translate content="collect special instructions or preferences from customers" />
                </p>
              </div>
              <BooleanField state={requireBuyerNotes} id="buyer-notes" />
            </div>
            <AnimatePresence>
              {requireBuyerNotes.get && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div>
                    <label className="font-medium text-sm">
                      <Translate content="placeholder text" />
                    </label>
                    <Field
                      inputName="notes-placeholder"
                      value={formData.notesPlaceholder}
                      onChange={(value) =>
                        handleInputChange("notesPlaceholder", value)
                      }
                      placeholder="Enter placeholder text..."
                      multiLines
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 font-medium text-sm">
                      <Icon icon={allIcons.solid.faRuler} />
                      <Translate content="maximum note length" />:
                      <span className="font-bold text-[--biqpod-primary]">
                        {formData.maxNotesLength}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="50"
                      value={formData.maxNotesLength || 500}
                      onChange={(e) =>
                        handleInputChange(
                          "maxNotesLength",
                          Number(e.target.value)
                        )
                      }
                      className="mt-2 w-full"
                    />
                    <p className="mt-1 text-[--biqpod-text-secondary] text-xs">
                      <Translate content="characters" />
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>
          {/* Product Display Section */}
          <Section title="product display" icon={allIcons.solid.faImage}>
            <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
              <div>
                <p className="font-medium">
                  <Translate content="show product images" />
                </p>
                <p className="text-[--biqpod-text-secondary] text-xs">
                  <Translate content="display product photos in order form" />
                </p>
              </div>
              <BooleanField
                state={showProductImages}
                id="show-product-images"
              />
            </div>
            <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
              <div>
                <p className="font-medium">
                  <Translate content="show descriptions" />
                </p>
                <p className="text-[--biqpod-text-secondary] text-xs">
                  <Translate content="display detailed product information" />
                </p>
              </div>
              <BooleanField
                state={showProductDescription}
                id="show-product-desc"
              />
            </div>
          </Section>
          {/* Order Options Section */}
          <Section title="order options" icon={allIcons.solid.faCartShopping}>
            <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
              <div>
                <p className="font-medium">
                  <Translate content="allow multiple products" />
                </p>
                <p className="text-[--biqpod-text-secondary] text-xs">
                  <Translate content="let customers select multiple different products" />
                </p>
              </div>
              <BooleanField
                state={allowMultipleProducts}
                id="allow-multiple-products"
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
              <BooleanField
                state={requireDeliveryAddress}
                id="require-delivery-address"
              />
            </div>
            <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
              <div>
                <p className="font-medium">
                  <Translate content="require phone number" />
                </p>
                <p className="text-[--biqpod-text-secondary] text-xs">
                  <Translate content="make phone field required" />
                </p>
              </div>
              <BooleanField
                state={requirePhoneNumber}
                id="require-phone-number"
              />
            </div>
            <div className="flex justify-between items-center bg-[--biqpod-background] p-3 rounded">
              <div>
                <p className="font-medium">
                  <Translate content="show store information" />
                </p>
                <p className="text-[--biqpod-text-secondary] text-xs">
                  <Translate content="display store name and details" />
                </p>
              </div>
              <BooleanField
                state={showStoreInformation}
                id="show-store-information"
              />
            </div>
          </Section>
          {/* Custom Message Section */}
          <Section
            title="custom welcome message"
            icon={allIcons.solid.faComments}
          >
            <Field
              inputName="custom-message"
              value={formData.customMessage}
              onChange={(value) => handleInputChange("customMessage", value)}
              placeholder="Add a custom welcome message for your customers..."
              multiLines
              rows={3}
              maxRows={5}
            />
            <p className="mt-2 text-[--biqpod-text-secondary] text-xs">
              <Translate content="this message will appear at the top of the order form" />
            </p>
          </Section>
        </Scroll>
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 p-4">
          <Button
            onClick={() => closePopup()}
            icon={allIcons.solid.faXmark}
            className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          >
            <Translate content="cancel" />
          </Button>
          <Button
            onClick={handleSave}
            icon={allIcons.solid.faSave}
            className="bg-[--biqpod-success] text-[--biqpod-primary-content]"
          >
            <Translate
              content={profile ? "update profile" : "create profile"}
            />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
