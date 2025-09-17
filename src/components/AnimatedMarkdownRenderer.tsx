import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MarkdownRenderer from "./MarkdownRenderer";
interface AnimatedMarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}
export const AnimatedMarkdownRenderer: React.FC<
  AnimatedMarkdownRendererProps
> = ({ content, className = "", isStreaming = false }) => {
  const [displayedTokens, setDisplayedTokens] = useState<string[]>([]);
  useEffect(() => {
    if (!isStreaming) {
      // If not streaming, show content immediately without token animation
      const tokens = content.split(/(\s+)/).filter((token) => token.length > 0);
      setDisplayedTokens(tokens);
      return;
    }
    // Split content into tokens (words and spaces) - this preserves spaces
    const currentTokens = content
      .split(/(\s+)/)
      .filter((token) => token.length > 0);
    if (currentTokens.length > displayedTokens.length) {
      // Animate new tokens one by one
      let tokenIndex = displayedTokens.length;
      const animateTokens = () => {
        const interval = setInterval(() => {
          if (tokenIndex >= currentTokens.length) {
            clearInterval(interval);
            return;
          }
          setDisplayedTokens(currentTokens.slice(0, tokenIndex + 1));
          tokenIndex++;
        }, 120); // Slower for better readability
        return () => clearInterval(interval);
      };
      const cleanup = animateTokens();
      return cleanup;
    }
  }, [content, displayedTokens.length, isStreaming]);
  // For completed content, show with entrance animation using markdown
  return (
    <motion.div
      className={className}
      initial={!isStreaming ? {} : { opacity: 0, y: 8 }}
      animate={!isStreaming ? {} : { opacity: 1, y: 0 }}
      transition={
        !isStreaming
          ? {}
          : {
              duration: 0.4,
              ease: "easeOut",
              delay: 0.1,
            }
      }
    >
      <MarkdownRenderer content={displayedTokens.join("")} />
    </motion.div>
  );
};
export default AnimatedMarkdownRenderer;
