import {
  Card,
  Translate,
  Line,
  Scroll,
  InnerTranslate,
  MarkDown,
  BooleanField,
  Button,
  CircleLoading,
} from "@biqpod/app/ui/components";
import { useCopyState, showToast } from "@biqpod/app/ui/hooks";
import { delay, tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "../../apis";
import { useStoreId } from "../../utils";

export const Agres = () => {
  const conditions = `# Terms & Conditions — Order Retention & Data Access

**TL;DR:** Orders older than **1 month** are removed from the app. Enable Drive sync or export your data to keep a copy.

1. **Retention window** — Orders and order history older than **one (1) month** are removed from SnapBuy's active servers and will no longer appear in the store dashboard.

2. **Drive sync & exports** — If you enable and complete synchronization with Google Drive (or another linked cloud provider), copies of older orders *may* be available in that linked storage. We strongly recommend exporting important reports or orders using the Store export tools before the one-month window closes.

3. **What deletion means** — "Deleted" records are not accessible via the app or primary database. SnapBuy may keep encrypted backups for a limited time for recovery, fraud investigation, or legal obligations; backups are not directly accessible to users.

4. **Your responsibility** — You are responsible for enabling and verifying cloud sync and for storing exported copies securely. SnapBuy does not control third-party storage providers and is not responsible for their policies or outages.

5. **Legal & compliance exceptions** — Some records may be retained longer if required by law, regulation, or ongoing investigations; those cases will follow applicable legal processes and our Privacy Policy.

6. **Notifications & changes** — If we plan to change the retention schedule in a way that affects your data, we will attempt to notify the account owner at least **7 days** in advance so you can export or back up your information.

7. **Restores & guarantees** — Restores from backups are handled case-by-case and are not guaranteed. For guaranteed retention, enable cloud sync or consider plans/features that include extended retention and backups.

8. **Security** — We protect stored data and transfers using industry practices (encryption in transit and at rest where applicable). You should also secure your linked accounts (strong passwords, two-factor authentication).

9. **Contact & support** — For help exporting or backing up orders, contact **support@biqpod.com** or use the in-app "Send Feedback" option.

10. **Acceptance** — By using SnapBuy and enabling synchronization, you acknowledge and consent to these retention and deletion practices. Please also review our Terms of Service and Privacy Policy for more details.`;
  const isChecked = useCopyState<null | undefined | boolean>(false);
  const storeId = useStoreId();
  const loading = useCopyState(false);
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Card className="relative max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="p-2">
          <h1 className="text-2xl">
            <Translate content="Accept Terms and Conditions" />
          </h1>
        </div>
        <Line />
        <Scroll>
          <div className="p-2">
            <InnerTranslate
              content={conditions}
              component={({ result }) => <MarkDown value={result} />}
            />
          </div>
        </Scroll>
        <Line />
        <div className="flex justify-between items-center p-3">
          <div className="flex items-center gap-2">
            <BooleanField
              state={isChecked}
              config={{
                style: "checkbox",
              }}
            />
            (<Translate content="i agree" />)
          </div>
          <Button
            onClick={async () => {
              loading.set(true);
              try {
                await snapbuyApi.store.upsert({
                  id: storeId!,
                  agres: true,
                });
                showToast("Thank you for accepting the terms.");
              } catch {
                showToast("An error occurred. Please try again.", "error");
              }
              loading.set(false);
              await delay(200);
              location.reload();
            }}
            className={tw(
              "w-fit",
              !isChecked.get &&
                "opacity-50 pointer-events-none text-[--biqpod-text-color] bg-[--biqpod-gray-opacity]"
            )}
          >
            <Translate content="Done" />
          </Button>
        </div>
        {loading.get && (
          <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity-2]">
            <CircleLoading />
          </div>
        )}
      </Card>
    </div>
  );
};
