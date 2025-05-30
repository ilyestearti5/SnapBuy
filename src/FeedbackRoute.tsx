import { allIcons } from "@biqpod/app/ui/apis";
import { Translate, Button } from "@biqpod/app/ui/components";
import { langHooks, openMenu } from "@biqpod/app/ui/hooks";
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
  return (
    <div className="flex justify-center items-center gap-2 w-full h-full">
      <span>
        <Button
          className="p-8 rounded-full max-md:text-2xl md:text-3xl"
          onClick={({ clientX, clientY }) => {
            openMenu({
              x: clientX,
              y: clientY,
              menu: [
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
              }),
            });
          }}
          rightIcon={allIcons.solid.faChevronRight}
        >
          <Translate content="join feed" />
        </Button>
      </span>
    </div>
  );
};
