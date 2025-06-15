import { allIcons } from "@biqpod/app/ui/apis";
import { CircleTip } from "@biqpod/app/ui/components";
import { isLoading, setFieldValue, useCopyState } from "@biqpod/app/ui/hooks";
import { useRef, useEffect } from "react";
import { setFocused, tw } from "@biqpod/app/ui/utils";
interface SpeechRecognition {
  new (): SpeechRecognition;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResult[];
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence?: number;
}
interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}
export function VoiceControlUI() {
  const isListening = useCopyState(false);
  const statusMessage = useCopyState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isProcessing = isLoading("interpretCommand");
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        statusMessage.set(
          "Speech recognition is not supported by your browser. You can still type commands."
        );
        return;
      }
      recognitionRef.current = new SpeechRecognitionAPI();
      const recognition = recognitionRef.current!;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onstart = () => {
        setFocused("ai-input");
        statusMessage.set("Listening... Speak your command.");
        isListening.set(true);
      };
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setFieldValue("ai-input", finalTranscript || interimTranscript);
      };
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = "An error occurred during speech recognition.";
        if (event.error === "no-speech") {
          errorMessage = "No speech detected. Please try again.";
        } else if (event.error === "audio-capture") {
          errorMessage = "Microphone not available or not working.";
        } else if (event.error === "not-allowed") {
          errorMessage =
            "Permission to use microphone was denied or has not been granted. Please allow microphone access in your browser settings.";
        }
        statusMessage.set(errorMessage);
        isListening.set(false);
      };
      recognition.onend = () => {
        isListening.set(false);
        if (statusMessage.get === "Listening... Speak your command.") {
          statusMessage.set("");
        }
      };
    } else {
      statusMessage.set(
        "Speech recognition is not supported by your browser. You can still type commands."
      );
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array: set up once on mount. statusMessage is managed internally by handlers.
  const handleToggleListening = () => {
    if (isProcessing || !recognitionRef.current) {
      if (!recognitionRef.current) {
        statusMessage.set("Speech recognition not available or not supported.");
      }
      return;
    }
    const recognition = recognitionRef.current;
    if (isListening.get) {
      recognition.stop();
    } else {
      setFieldValue("ai-input", "");
      statusMessage.set("");
      try {
        recognition.start();
      } catch (e: any) {
        if (e.name === "InvalidStateError") {
          // This can happen if start() is called while it's already starting or stopping.
          statusMessage.set(
            "Recognition busy. Please wait a moment and try again."
          );
        } else {
          statusMessage.set("Could not start listening. Please try again.");
        }
        isListening.set(false);
      }
    }
    isListening.set(!isListening.get);
  };
  return (
    <CircleTip
      onClick={handleToggleListening}
      className={tw("text-[--biqpod-primary]")}
      // disabled={isProcessing || !recognitionRef.current}
      icon={
        isProcessing
          ? allIcons.solid.faSpinner
          : isListening.get
          ? allIcons.solid.faCircleStop
          : allIcons.solid.faMicrophone
      }
    />
  );
}
