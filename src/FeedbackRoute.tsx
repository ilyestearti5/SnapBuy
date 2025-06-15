import { allIcons } from "@biqpod/app/ui/apis";
import {
  Translate,
  Button,
  EmptyComponent,
  Icon,
  Line,
  Card,
} from "@biqpod/app/ui/components";
import {
  langHooks,
  openMenu,
  showBottomSheet,
  useDeviceResolution,
} from "@biqpod/app/ui/hooks";
import { MenuRecordProps } from "@biqpod/app/ui/types";
import image from "./assets/feeds-background.png";
import { useMemo } from "react";
export const useWords = () => {
  const langs = langHooks.getAll();
  const words = useMemo(() => {
    return langs.map((lang) => {
      return lang.word;
    });
  }, [langs]);
  return words;
};
export const FeedbackRoute = () => {
  const { isMobile } = useDeviceResolution();
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Card className="relative max-w-[80vw] overflow-hidden">
        <img draggable={false} src={image} />
        <Line />
        <div className="flex justify-center items-center p-2">
          <Button
            className="p-3 rounded-full w-fit"
            onClick={({ clientX, clientY }) => {
              const menu: MenuRecordProps[] = [
                {
                  name: "Messenger",
                  icon: allIcons.brands.faFacebookMessenger,
                  link: "https://web.facebook.com/messages/t/503063686232064",
                },
                {
                  name: "Twitter",
                  icon: allIcons.brands.faTwitter,
                  link: "https://x.com/ilyestearti5",
                },
                {
                  name: "Instagram",
                  icon: allIcons.brands.faInstagram,
                  link: "https://www.instagram.com/biqpod/",
                },
                {
                  name: "Discord",
                  icon: allIcons.brands.faDiscord,
                  link: "https://discord.gg/Nb6wwXyj",
                },
                {
                  name: "Snapchat",
                  icon: allIcons.brands.faSnapchatGhost,
                  link: "https://www.snapchat.com/add/tiartiilyes",
                },
                {
                  name: "TikTok",
                  icon: allIcons.brands.faTiktok,
                  link: "https://www.tiktok.com/@biqpod",
                },
              ].map(({ name, icon, link }) => {
                return {
                  label: name,
                  defaultIcon: icon,
                  click: () => {
                    const anchor = document.createElement("a");
                    anchor.href = link;
                    anchor.target = "_blank";
                    anchor.click();
                  },
                };
              });
              if (isMobile) {
                showBottomSheet(
                  <EmptyComponent>
                    <div className="p-2">
                      <h1 className="font-bold text-3xl uppercase">
                        <Translate content="send feedback" />
                      </h1>
                    </div>
                    <Line />
                    {menu.map(({ label, defaultIcon, click }) => {
                      return (
                        <div
                          key={label}
                          className="flex items-center gap-2 hover:bg-[--biqpod-gray-opacity] active:bg-[--biqpod-gray-opacity-2] p-2 text-xl cursor-pointer"
                          onClick={() => click?.()}
                        >
                          <div className="flex justify-center w-[40px]">
                            <Icon icon={defaultIcon} />
                          </div>
                          <h1>{label && <Translate content={label} />}</h1>
                        </div>
                      );
                    })}
                  </EmptyComponent>
                );
                return;
              }
              openMenu({
                x: clientX,
                y: clientY,
                menu,
              });
            }}
          >
            <Translate content="send feedback" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
