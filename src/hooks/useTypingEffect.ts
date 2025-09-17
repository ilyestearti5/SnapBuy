import { useState, useEffect, useCallback } from "react";

export interface TypingState {
  displayText: string;
  isTyping: boolean;
  isComplete: boolean;
}

export function useTypingEffect(
  text: string,
  options: {
    speed?: number; // milliseconds per character
    startDelay?: number; // delay before starting
    onComplete?: () => void;
  } = {}
) {
  const { speed = 30, startDelay = 100, onComplete } = options;

  const [state, setState] = useState<TypingState>({
    displayText: "",
    isTyping: false,
    isComplete: false,
  });

  const startTyping = useCallback(() => {
    if (!text) {
      setState({
        displayText: "",
        isTyping: false,
        isComplete: true,
      });
      onComplete?.();
      return;
    }

    setState((prev) => ({
      ...prev,
      displayText: "",
      isTyping: true,
      isComplete: false,
    }));

    let currentIndex = 0;
    const words = text.split(" ");
    let currentText = "";

    const typeNextWord = () => {
      if (currentIndex < words.length) {
        currentText += (currentIndex === 0 ? "" : " ") + words[currentIndex];

        setState((prev) => ({
          ...prev,
          displayText: currentText,
        }));

        currentIndex++;
        setTimeout(typeNextWord, speed + Math.random() * 20); // Add slight randomness
      } else {
        setState((prev) => ({
          ...prev,
          isTyping: false,
          isComplete: true,
        }));
        onComplete?.();
      }
    };

    setTimeout(typeNextWord, startDelay);
  }, [text, speed, startDelay, onComplete]);

  const skipToEnd = useCallback(() => {
    setState({
      displayText: text,
      isTyping: false,
      isComplete: true,
    });
    onComplete?.();
  }, [text, onComplete]);

  const reset = useCallback(() => {
    setState({
      displayText: "",
      isTyping: false,
      isComplete: false,
    });
  }, []);

  useEffect(() => {
    if (text) {
      startTyping();
    }
  }, [text, startTyping]);

  return {
    ...state,
    skipToEnd,
    reset,
    startTyping,
  };
}
