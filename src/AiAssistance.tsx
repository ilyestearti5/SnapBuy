import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  Translate,
  CircleTip,
  Field,
  Line,
  Button,
  Icon,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  setFieldValue,
  setSettingValue,
  showPopup,
  showProfile,
  showToast,
  useAction,
  useCopyState,
  useResolution,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo } from "react";
import { VoiceControlUI } from "./VoiceControls";
import { delay, mergeObject, tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "./apis";
import { useHistory } from "react-router";
import pinUri from "./assets/ping.mp3";
import { CartPopup } from "./CartPopup";
import { useClientStoreId } from "./utils";
import { Link } from "react-router-dom";
import { initialHeight, isAndroidWeb } from "./utils";
interface SpeechProps {
  text?: string;
  voice?: string;
}
async function playAudio(uri: string) {
  const audio = new Audio(uri);
  await audio.play();
}
const listOfPathNames = [
  {
    name: "home",
    path: "/home",
  },
  {
    name: "stores",
    path: "/store",
  },
  {
    name: "deliveries",
    path: "/deliveries",
  },
  {
    name: "offers",
    path: "/offers",
  },
  {
    name: "plans",
    path: "/plans",
  },
];
const actions = [
  {
    icon: allIcons.solid.faLocationDot,
    name: "location",
    context: "location",
  },
  {
    icon: allIcons.solid.faStore,
    name: "store",
    context: "current-store",
  },
];
export const AiAssistance = () => {
  const command = getFieldValue("ai-input");
  const speechSynthesis = useCopyState<SpeechSynthesis | null>(null);
  const availableVoices = useCopyState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      speechSynthesis.set(synth);
      const updateVoices = () => {
        availableVoices.set(synth.getVoices());
      };
      // Initial fetch and listen for changes
      // Voices list might be populated asynchronously
      if (synth.getVoices().length) {
        updateVoices();
      }
      synth.onvoiceschanged = updateVoices;
      return () => {
        synth.onvoiceschanged = null;
      };
    }
  }, []);
  const voiceRunning = useCopyState<string | null>(null);
  useAction(
    "speak",
    ({ text = "", voice }: SpeechProps) => {
      if (!speechSynthesis.get) {
        console.warn("Speech synthesis not available.");
        showToast("Speech synthesis not available.", "error");
        return;
      }
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        if (availableVoices.get.length > 0) {
          let selectedVoice: SpeechSynthesisVoice | undefined;
          if (voice) {
            selectedVoice = availableVoices.get.find(
              (v) => v.voiceURI === voice
            );
          }
          if (!selectedVoice) {
            throw new Error("Selected voice not found in available voices.");
          }
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }
        voiceRunning.set(utterance.voice?.voiceURI || null);
        speechSynthesis.get.cancel();
        speechSynthesis.get.speak(utterance);
        utterance.onend = () => {
          voiceRunning.set(null);
        };
      } catch (error: any) {
        showToast("Error speaking text: " + error.message, "error");
      }
    },
    [speechSynthesis.get, availableVoices.get]
  );
  const hist = useHistory();
  const storeId = useClientStoreId();
  const interpretCommandAction = useAction(
    "interpretCommand",
    async () => {
      if (!command) {
        showToast("Please enter a command", "error");
        return;
      }
      const result = await snapbuyApi.interpretCommand(command);
      const actions = [
        {
          actionId: "go_back",
          callback: () => {
            hist.goBack();
          },
        },
        {
          actionId: "view_profile",
          callback: () => {
            showProfile();
          },
        },
        {
          actionId: "search_product",
          callback: () => {
            setFieldValue(
              "search-prod",
              result?.params?.name?.toString() || ""
            );
          },
        },
        {
          actionId: "set_dark_mode",
          callback: () => {
            setSettingValue(
              "window/dark.boolean",
              result?.params?.to === "dark"
            );
          },
        },
        {
          actionId: "change_language",
          callback: () => {
            setSettingValue(
              "window/lang.enum",
              result?.params?.langId?.toString().slice(0, 2).toLowerCase() ||
                "en"
            );
          },
        },
        {
          actionId: "view_cart",
          callback() {
            if (storeId) {
              closePopup();
              showPopup(<CartPopup storeId={storeId} />);
            }
          },
        },
        {
          actionId: "go_to_page",
          callback: () => {
            const page = result?.params?.page?.toString().toLowerCase();
            if (!page) {
              showToast("Page not found", "error");
              return;
            }
            const inList = listOfPathNames.find(({ name }) =>
              name.includes(page)
            );
            if (!inList) {
              showToast("Page not found", "error");
              return;
            }
            if (!inList.path) {
              showToast("Page not found", "error");
              return;
            }
            document.getElementById(inList.name)?.click();
          },
        },
      ];
      const found = actions.find(
        (action) => action.actionId === result?.action
      );
      if (!found) {
        return;
      }
      setFieldValue("ai-input", "");
      await playAudio(pinUri);
      await delay(100);
      closePopup();
      found.callback();
    },
    [command, hist, storeId]
  );
  const usedAction = useCopyState<Record<string, boolean>>({});
  const { height } = useResolution();
  const keyboardHeight = useMemo(() => {
    return initialHeight - height;
  }, [height]);

  return (
    <Card
      className="bottom-[-1px] absolute border-b-0 max-md:w-full md:min-w-[50%] md:max-w-[80vw] overflow-hidden"
      style={{
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        ...mergeObject(
          isAndroidWeb &&
            keyboardHeight !== 0 && {
              bottom: keyboardHeight + "px",
            }
        ),
      }}
    >
      <div className="bg-to-l from-[--biqpod-gray-opacity] to-[--biqpod-gray-opacity-2]">
        <div className="flex justify-between items-center gap-2 p-2">
          <h1 className="font-bold text-2xl capitalize">
            <Translate content="ai assistance" />
          </h1>
          <div>
            <CircleTip
              icon={allIcons.solid.faXmark}
              onClick={() => {
                closePopup();
              }}
            />
          </div>
        </div>
        <Line />
        <div className={tw("relative")}>
          <div className="flex items-center gap-2 p-2">
            <Field
              inputName="ai-input"
              className="rounded-2xl"
              placeholder="Give Job!"
              rows={Math.min(5, Math.max(1, command?.split("\n").length || 1))}
              multiLines
            />
            <div className="flex">
              <VoiceControlUI />
              <CircleTip
                iconClassName={tw(
                  interpretCommandAction?.status === "loading" && "animate-spin"
                )}
                icon={
                  interpretCommandAction?.status === "loading"
                    ? allIcons.solid.faSpinner
                    : allIcons.solid.faPaperPlane
                }
                onClick={async () => {
                  execAction("interpretCommand");
                }}
              />
            </div>
          </div>
          <Line />
          <div className="flex gap-1 p-2">
            {actions.map((action, index) => {
              const isUsed = usedAction.get[action.context] || false;
              return (
                <Button
                  key={index}
                  onClick={() => {
                    usedAction.set((prev) => ({
                      ...prev,
                      [action.context]: !isUsed,
                    }));
                  }}
                  className={tw(
                    "w-fit flex-1 h-[40px] bg-[--biqpod-secondary] text-[--biqpod-secondary-content] transition-[max-width] rounded-full max-w-[40px]",
                    isUsed && "max-w-[150px]",
                    !isUsed &&
                      "text-[--biqpod-text-color] bg-[--biqpod-gray-opacity]"
                  )}
                >
                  <div className="flex items-center">
                    <Icon icon={action.icon} />
                    <span
                      className={tw(
                        "inline-block overflow-hidden transition-[filter,max-width,margin] duration-500",
                        isUsed && "max-w-[150px] ml-2 blur-0",
                        !isUsed && "max-w-[0px] ml-0 blur-md"
                      )}
                    >
                      <Translate content={action.name} />
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
      {listOfPathNames.map(({ name, path }) => {
        return <Link key={name} to={path} hidden id={name} />;
      })}
    </Card>
  );
};
