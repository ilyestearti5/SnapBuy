import { allIcons } from "biqpod/ui/apis";
import {
  Card,
  CircleTip,
  ExcelPopup,
  Translate,
  Line,
  BooleanFeild,
  Icon,
  Button,
} from "biqpod/ui/components";
import {
  useCopyState,
  useUser,
  useAsyncEffect,
  closePopup,
  showPopup,
  execAction,
} from "biqpod/ui/hooks";
import { doubleFilter } from "biqpod/ui/utils";
import { useMemo } from "react";
import { api } from "../apis";
interface PopupClientProps {
  clients: SnapBuy.Client[];
  file?: string;
}
export const PopupClient = ({ clients, file }: PopupClientProps) => {
  const existsState = useCopyState<null | boolean>(false);
  const newsState = useCopyState<null | boolean>(false);
  const user = useUser();
  const allClients = useCopyState<SnapBuy.Client[] | null>(null);
  useAsyncEffect(async () => {
    if (!user?.uid) return allClients.set(null);
    const newClients = await api.getAllClients();
    allClients.set(newClients);
  }, [user?.uid]);
  const [exists, news] = useMemo(() => {
    if (!allClients.get) return [null, null];
    const [exists, news] = doubleFilter(clients, (client) => {
      return !!allClients.get!.find((c) => c.phone === client.phone);
    });
    return [exists, news];
  }, [allClients.get]);
  return (
    <Card className="md:w-1/2 max-md:w-10/12">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-2">
          {file && (
            <CircleTip
              onClick={() => {
                closePopup();
                showPopup(
                  <ExcelPopup
                    uri={file!}
                    options={["name", "phone", "id"]}
                    onChange={(json) => {
                      showPopup(<PopupClient clients={json} file={file} />);
                    }}
                    title="Excel File"
                  />
                );
              }}
              icon={allIcons.solid.faChevronLeft}
            />
          )}
          <h1 className="font-bold text-3xl capitalize">
            <Translate content="insert new clients" />
          </h1>
        </div>
        <div className="flex">
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div>
        <div className="flex items-center gap-2 p-2">
          <BooleanFeild id="exists-clients" state={existsState} />
          <span className="text-xl capitalize">
            <Translate content="exists" />
          </span>
          {exists === null && (
            <Icon
              icon={allIcons.solid.faSpinner}
              iconClassName="animate-spin"
            />
          )}
          {exists !== null && (
            <span className="font-bold text-xl">({exists.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2 p-2">
          <BooleanFeild id="exists-clients" state={newsState} />
          <span className="text-xl capitalize">
            <Translate content="news" />
          </span>
          {news === null && (
            <Icon
              icon={allIcons.solid.faSpinner}
              iconClassName="animate-spin"
            />
          )}
          {news !== null && (
            <span className="font-bold text-xl">({news.length})</span>
          )}
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Button
          className="rounded-full"
          onClick={() => {
            const options: AddClientActionProps = {
              exists: exists ?? undefined,
              news: news ?? undefined,
            };
            execAction("add-clients", options);
            closePopup();
          }}
        >
          <Translate content="add clients" />
        </Button>
      </div>
    </Card>
  );
};
