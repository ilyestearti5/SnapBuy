import { allIcons } from "@biqpod/app/ui/apis";
import {
  EmptyComponent,
  Translate,
  Line,
  EnumField,
  BooleanField,
  Button,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  useSettingConfig,
  showToast,
  closeBottomSheet,
} from "@biqpod/app/ui/hooks";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
interface CopyStoreLinkBottomSheetProps {
  storeId: string;
}
export const CopyStoreLinkBottomSheet = ({
  storeId,
}: CopyStoreLinkBottomSheetProps) => {
  const langState = useCopyState<string | Nothing>(null);
  const langs = useSettingConfig("window/lang.enum");
  const isDark = useCopyState<Biqpod.System.Setting.Value["boolean"]>(false);
  const showPhoto = useCopyState<Biqpod.System.Setting.Value["boolean"]>(true);
  const copy = async () => {
    closeBottomSheet();
    const url = new URL(window.location.href);
    url.pathname = `/client/stores/${storeId}`;
    langState.get && url.searchParams.append("lang", langState.get);
    url.searchParams.append("dark", isDark.get ? "true" : "false");
    url.searchParams.append("photo", showPhoto.get ? "1" : "0");
    await navigator.clipboard.writeText(url.toString());
    showToast("Link copied to clipboard");
  };
  return (
    <EmptyComponent>
      <div className="flex justify-between items-center p-3">
        <h1 className="font-bold text-2xl uppercase">
          <Translate content="create link" />
        </h1>
      </div>
      <Line />
      <div>
        <div className="flex max-md:flex-col items-center gap-2 p-2">
          <label className="w-full md:text-right">
            <Translate content="language" /> :
          </label>
          {langs && (
            <EnumField config={langs} state={langState} id="lang-info" />
          )}
        </div>
        <div className="flex items-center gap-2 p-2">
          <label className="w-full text-right">
            <Translate content="dark?" /> :
          </label>
          <div className="w-full">
            <BooleanField config={{}} state={isDark} id="is-dark" />
          </div>
        </div>
        <div className="flex items-center gap-2 p-2">
          <label className="w-full text-right">
            <Translate content="show product's photo?" /> :
          </label>
          <div className="w-full">
            <BooleanField config={{}} state={showPhoto} id="show-photo" />
          </div>
        </div>
        <div className="h-[100px]"></div>
      </div>
      <Line />
      <div className="p-2">
        <Button
          icon={allIcons.regular.faCopy}
          onClick={() => {
            copy();
          }}
        >
          <Translate content="copy & close" />
        </Button>
      </div>
    </EmptyComponent>
  );
};
