import { useFormMetadata, setFormMetadata } from "../../../apis/getFns";
import { MetadataFieldComponent } from "../../../components/MetadataField";
export const ProductMetadata = () => {
  const metadataState = useFormMetadata();
  const metadata = metadataState?.get;
  return (
    <MetadataFieldComponent
      metadata={metadata || undefined}
      onChangeMetadata={setFormMetadata}
      showAddSection={true}
      showFieldActions={true}
    />
  );
};
