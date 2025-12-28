import { Translate } from "@biqpod/app/ui/components";
import { motion } from "framer-motion";
interface CreateFirstUIProps {
  photo?: string;
  title?: string;
  description?: string;
}
export const CreateFirstUI = ({
  photo,
  title,
  description,
}: CreateFirstUIProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center items-center h-full overflow-hidden"
    >
      <div className="flex flex-col items-center gap-6 p-8">
        {photo && (
          <motion.img
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 0.6 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            draggable={false}
            src={photo}
            className="w-40 h-40"
          />
        )}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          {title && (
            <h3 className="mb-2 font-semibold text-[--biqpod-text-color] text-xl capitalize">
              <Translate content={title} />
            </h3>
          )}
          {description && (
            <p className="text-[--biqpod-gray-opacity-2] mb-4 max-w-sm text-sm">
              <Translate content={description} />
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
