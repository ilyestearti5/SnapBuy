import { allIcons } from "biqpod/ui/apis";
import {
  Button,
  Card,
  CircleLoading,
  CircleTip,
  Field,
  Line,
  Translate,
} from "biqpod/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  setFieldValue,
  showToast,
  useCopyState,
  useUser,
} from "biqpod/ui/hooks";
import { setDoc } from "../server";
import { setFocused } from "biqpod/ui/utils";
export const AddClient = () => {
  const user = useUser();
  const name = getFieldValue("client-name");
  const phone = getFieldValue("client-phone");
  const loading = useCopyState(false);
  return (
    <Card className="relative max-md:rounded-none max-md:w-full max-md:h-full">
      <div className="flex justify-between items-center p-2">
        <h1 className="font-bold text-2xl capitalize">
          <Translate content="add client" />
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
      <div className="h-full">
        <div className="p-2">
          <Field inputName="client-name" placeholder="Enter Name" />
        </div>
        <div className="p-2">
          <Field
            inputName="client-phone"
            placeholder="Enter Phone Number"
            controls={{
              ["^0[0-9]{9}$"]: {
                succ: "valide phone number",
                err: "invalid phone number",
              },
            }}
          />
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Button
          icon={allIcons.solid.faAdd}
          onClick={async () => {
            if (!name) {
              showToast("Please enter a name", "error");
              setFocused("client-name");
              return;
            }
            if (!phone) {
              showToast("Please enter a phone number", "error");
              setFocused("client-phone");
              return;
            }
            if (!user?.uid) {
              return;
            }
            loading.set(true);
            try {
              const uid = crypto.randomUUID();
              await setDoc(
                ["projects", import.meta.env.VITE_PROJECT_ID, "clients", uid],
                {
                  name,
                  phone,
                  uid: user.uid,
                }
              );
              showToast("Client added successfully", "success");
              execAction("get-clients");
              setFieldValue("client-name", "");
              setFieldValue("client-phone", "");
              closePopup();
            } catch (e) {
              console.log(e);
            }
            loading.set(false);
          }}
        >
          <Translate content="add client" />
        </Button>
      </div>
      {loading.get && (
        <div className="absolute inset-0 flex justify-center items-center">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
