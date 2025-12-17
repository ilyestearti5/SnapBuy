import { Translate } from "@biqpod/app/ui/components";
export interface FormSectionProps {
  title: string;
}
export const FormSection = ({ title }: FormSectionProps) => {
  return (
    <div className="bg-[--biqpod-primary-background]">
      <div className="p-3 text-3xl capitalize">
        <Translate content={title} />
      </div>
    </div>
  );
};
