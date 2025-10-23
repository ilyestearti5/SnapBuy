import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleLoading,
  EnumField,
  Field,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import { execAction, isLoading, useTemp } from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { rolsInList } from "../utils";
interface UpsertAccountProps {
  account?: Snapbuy.Account;
}
export const UpsertAccount = ({ account }: UpsertAccountProps) => {
  const roleState = useTemp<string | Nothing>("roleState");

  const loadingAddAccount = isLoading("upsert-account");

  return (
    <Card className="relative max-md:rounded-none max-md:w-full min-w-[400px] max-md:h-full">
      <CardHeaderForPopup title={account ? "Edit Account" : "Add Account"} />
      <Line />
      <div className="h-full">
        <div className="flex flex-col gap-2 p-2">
          <Field inputName="account-firstname" placeholder="Enter First Name" />
          <Field inputName="account-lastname" placeholder="Enter Last Name" />
          <Field
            inputName="account-phone"
            maxLength={10}
            controls={{
              "[0-9]{10}": {
                succ: "Valide",
                err: "Invalid Phone Number",
              },
            }}
            placeholder="Enter Phone Number"
          />
          <EnumField
            config={{
              list: rolsInList,
            }}
            state={roleState}
            id="role-state"
          />
        </div>
      </div>
      <Line />
      <div className="p-2">
        <Button
          icon={allIcons.solid.faPlus}
          onClick={async () => {
            execAction("upsert-account");
          }}
        >
          <Translate content="add" />
        </Button>
      </div>
      {loadingAddAccount && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
