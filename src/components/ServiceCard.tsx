import React from "react";
import { Card, ClickedView, Line, Translate } from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { tw } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
interface ServiceCardProps {
  link: string;
  name: string;
  photo: string;
  index: number;
  isExternal?: boolean;
}
export const ServiceCard = React.memo<ServiceCardProps>(
  ({ link, name, photo, index, isExternal = false }) => {
    const animationProps = React.useMemo(
      () => ({
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay: index * 0.1, duration: 0.3 },
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      }),
      [index]
    );
    const content = React.useMemo(
      () => (
        <Card className={tw("overflow-hidden")}>
          <ClickedView>
            <div className="flex justify-center p-5">
              <img src={photo} className="w-[100px] object-cover" />
            </div>
            <Line />
            <div className="p-2 text-xl text-center capitalize">
              <Translate content={name} />
            </div>
          </ClickedView>
        </Card>
      ),
      [photo, name]
    );
    if (isExternal) {
      return (
        <motion.div {...animationProps}>
          <a target="_blank" href={link} rel="noopener noreferrer">
            {content}
          </a>
        </motion.div>
      );
    }
    return (
      <motion.div {...animationProps}>
        <Link to={link}>{content}</Link>
      </motion.div>
    );
  }
);
