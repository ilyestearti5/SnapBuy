import { Line, Translate } from "@biqpod/app/ui/components";
import { useColorMerge } from "@biqpod/app/ui/hooks";

export interface FormSectionProps {
  title: string;
}
export const FormSection = ({ title }: FormSectionProps) => {
  const colorMerge = useColorMerge();
  return (
    <div
      style={{
        ...colorMerge("secondary.background"),
      }}
    >
      <Line />
      <div className="p-3 text-3xl capitalize">
        <Translate content={title} />
      </div>
      <Line />
    </div>
  );
};
