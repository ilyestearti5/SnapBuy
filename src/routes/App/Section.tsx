import { Translate } from "@biqpod/app/ui/components";

interface SectionProps {
  text: string;
}
export const Section = ({ text }: SectionProps) => {
  return (
    <div className="flex justify-center items-center p-4">
      <h1 className="bg-clip-text bg-gradient-to-r from-[--biqpod-secondary] to-[--biqpod-primary] drop-shadow-md font-extrabold text-transparent text-4xl text-center capitalize">
        <Translate content={text} />
      </h1>
    </div>
  );
};
