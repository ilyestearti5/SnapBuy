import {
  allIcons,
  and,
  CloudSelection,
  orderBy,
  where,
} from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closeBottomSheet,
  closePopup,
  execAction,
  getFieldValue,
  getTemp,
  isLoading,
  openMenu,
  setFieldValue,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useUser,
} from "@biqpod/app/ui/hooks";
import { UpsertAccount } from "./UpsertAccount";
import { snapbuyApi } from "../apis";
import { mergeArray, tw } from "@biqpod/app/ui/utils";
import { cloud } from "../server";
import { useEffect, useMemo } from "react";
import { Nothing } from "@biqpod/app/ui/types";
import { rolsInList } from "../utils";
import { FilterAccounts, useAccountFilterState } from "./FilterAccounts";
const PAGE_SIZE = 10;
export const Accounts = () => {
  const accounts = useCopyState<Snapbuy.Account[] | null>(null);
  const firstname = getFieldValue("account-firstname");
  const lastname = getFieldValue("account-lastname");
  const phone = getFieldValue("account-phone");
  const role = getTemp<Snapbuy.DeliveryCompanyRole | Nothing>("roleState");
  useAction(
    "upsert-account",
    async (id?: string) => {
      if (!role) {
        showToast("Please select a role", "error");
        return;
      }
      if (!firstname || !lastname || !phone) {
        showToast("Please fill all fields", "error");
        return;
      }
      const account: Snapbuy.Account = {
        id,
        firstname,
        lastname,
        phone,
        role,
      };
      if (!id) {
        account.createdAt = Date.now();
      }
      setFieldValue("account-firstname", "");
      setFieldValue("account-lastname", "");
      setFieldValue("account-phone", "");
      setTemp("roleState", null);
      await snapbuyApi.account.upsert(account);
      closeBottomSheet();
      closePopup();
      execAction("get-accounts", false);
    },
    [firstname, lastname, phone]
  );
  const user = useUser();
  const lastDoc = useCopyState<Snapbuy.Account | null>(null);
  const hasMore = useCopyState(false);
  const filterState = useAccountFilterState();
  useAction(
    "get-accounts",
    async (next: boolean) => {
      if (!user?.uid) {
        return;
      }
      const currentTime = new Date();
      currentTime.setHours(23, 59, 59, 999);
      var subTime: Date | null = null;
      switch (filterState?.time) {
        case "today":
          subTime = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "this week":
          subTime = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "this month":
          subTime = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "this year":
          subTime = new Date(currentTime.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case "last week":
          subTime = new Date(currentTime.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case "last month":
          subTime = new Date(currentTime.getTime() - 60 * 24 * 60 * 1000);
          break;
        case "last year":
          subTime = new Date(currentTime.getTime() - 730 * 24 * 60 * 60 * 1000);
          break;
      }
      const selection: CloudSelection<Snapbuy.Account> = {
        where: and(
          where("uid", "==", user?.uid),
          filterState?.phone && where("phone", "==", filterState.phone),
          subTime && where("createdAt", ">=", subTime.getTime()),
          filterState?.role && where("role", "==", filterState.role)
        ),
        orders: mergeArray(orderBy("createdAt", "desc")),
        limit: PAGE_SIZE,
        startAt:
          next && lastDoc.get?.createdAt ? [lastDoc.get?.createdAt] : undefined,
      };
      const newAccounts = await cloud.app.nosql.getDocs<Snapbuy.Account>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "accounts"],
        selection
      );
      if (!newAccounts) {
        return;
      }
      const list = newAccounts.map((order) => ({
        ...order.data,
        id: order.id,
      }));
      accounts.set((prev) => (next && prev ? [...prev, ...list] : list));
      const lastDocRef = newAccounts.at(-1)?.data;
      lastDoc.set(lastDocRef || null);
      hasMore.set(newAccounts.length === PAGE_SIZE);
    },
    [user]
  );
  useEffect(() => {
    if (user?.uid) {
      execAction("get-accounts");
    }
  }, [user?.uid]);
  const loading = isLoading("get-accounts");
  const search = getFieldValue("search-account");
  const filteredAccounts = useMemo(() => {
    if (!search) {
      return accounts.get;
    }
    return accounts.get?.filter((account) => {
      const fullName = `${account.firstname || ""} ${
        account.lastname || ""
      }`.trim();
      return (
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        account.phone?.toString().includes(search)
      );
    });
  }, [accounts.get, search]);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-2">
        <div className="relative w-full">
          <Field
            propositions={["@status"]}
            inputName="search-account"
            placeholder="Search For Account"
            className="rounded-xl"
          />
          {filteredAccounts && (
            <span className="top-1/2 right-3 absolute text-[--biqpod-primary] capitalize -translate-y-1/2 transform">
              / {filteredAccounts?.length || "No Accounts"}
            </span>
          )}
        </div>
        <div>
          <CircleTip
            icon={allIcons.solid.faFilter}
            onClick={() => {
              showPopup(<FilterAccounts />);
            }}
          />
        </div>
      </div>
      <Line />
      <Scroll>
        {!!filteredAccounts?.length && (
          <div className="flex flex-col gap-2 p-2">
            {filteredAccounts?.map((account, index) => {
              const fullName = `${account.firstname || ""} ${
                account.lastname || ""
              }`.trim();
              const role = rolsInList.find((o) => o.value === account.role);
              return (
                <Card key={index} className="w-full overflow-hidden">
                  <div className="flex items-center gap-2 p-2">
                    <span className="text-xl">{fullName}</span>
                  </div>
                  {account.address && (
                    <EmptyComponent>
                      <Line />
                      <div className="p-2 text-center">
                        <span className="italic">{account.address?.city}</span>
                      </div>
                    </EmptyComponent>
                  )}
                  <Line />
                  <div className="flex justify-between items-center p-2">
                    <span>{role?.content}</span>
                    <div className="flex items-center">
                      <CircleTip
                        icon={allIcons.solid.faPhone}
                        onClick={() => {
                          var a = document.createElement("a");
                          a.href = `tel:${account?.phone}`;
                          a.click();
                        }}
                      />
                      <CircleTip
                        icon={allIcons.solid.faEllipsisV}
                        onClick={async ({ clientX, clientY }) => {
                          openMenu({
                            x: clientX,
                            y: clientY,
                            menu: [
                              {
                                label: "Delete",
                                defaultIcon: allIcons.solid.faTrash,
                                click: async () => {
                                  if (account.id) {
                                    await snapbuyApi.account.delete(account.id);
                                    accounts.set(
                                      (prev) =>
                                        prev?.filter(
                                          (o) => o.id !== account.id
                                        ) || null
                                    );
                                  }
                                },
                              },
                            ],
                          });
                        }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
            {hasMore.get && (
              <div className="flex justify-center items-center gap-2 p-2">
                <span>
                  <Button
                    onClick={() => {
                      execAction("fetch-orders", {
                        next: true,
                      });
                    }}
                    icon={
                      loading
                        ? allIcons.solid.faCircleNotch
                        : allIcons.solid.faPaperPlane
                    }
                    className="rounded-full"
                    iconClassName={tw(loading && "animate-spin")}
                  >
                    <span
                      className={tw("transition-[font-family] duration-200")}
                      style={{
                        font: loading ? "0px" : "8px",
                      }}
                    >
                      <Translate content="fetch more" />
                    </span>
                  </Button>
                </span>
              </div>
            )}
          </div>
        )}
        {filteredAccounts && filteredAccounts.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <Card>
              <div className="text-center">
                <div className="p-4 text-8xl">
                  <Icon icon={allIcons.solid.faUserSlash} />
                </div>
                <Line />
                <h1 className="p-4 text-xl uppercase">
                  <Translate content="no accounts" />
                </h1>
              </div>
            </Card>
          </div>
        )}
      </Scroll>
      <Line />
      <div className="p-2">
        <Button
          className="rounded-full"
          onClick={() => {
            showPopup(<UpsertAccount />);
          }}
          icon={allIcons.solid.faPlus}
        >
          <Translate content="add new account" />
        </Button>
      </div>
    </div>
  );
};
