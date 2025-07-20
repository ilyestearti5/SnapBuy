import { allIcons } from "@biqpod/app/ui/apis";
import {
  Line,
  Scroll,
  Button,
  Card,
  Translate,
  CircleTip,
  Key,
  EmptyComponent,
  Icon,
  CardHeaderForPopup,
  MarkDown,
  CircleLoading,
} from "@biqpod/app/ui/components";
import {
  showPopup,
  useUser,
  useAction,
  showToast,
  execAction,
  isLoading,
  isSuccess,
  useSettingValue,
  setFieldValue,
  getTemp,
} from "@biqpod/app/ui/hooks";
import { SettingValueType } from "@biqpod/app/ui/types";
import { useFetchMoreAction } from "../../utils";
import { useEffect, useMemo } from "react";
import { useStoreId } from "../../App";
import { setFocused } from "@biqpod/app/ui/utils";
import { UpsertProp } from "./AddProp";
import { snapbuyApi } from "../../apis";
// Simple pastel colors for both dark and light backgrounds
const darkColors: Partial<Record<keyof SettingValueType, string>> = {
  boolean: "#7dd3fc", // light blue
  string: "#bbf7d0", // light green
  enum: "#fbcfe8", // light pink
  range: "#fde68a", // light yellow
  filter: "#a7f3d0", // mint
  array: "#ddd6fe", // light purple
  number: "#fca5a5", // light red
  pin: "#fdba74", // light orange
};
const lightColors: Partial<Record<keyof SettingValueType, string>> = {
  boolean: "#2563eb", // deeper blue
  string: "#22c55e", // deeper green
  enum: "#db2777", // deeper pink
  range: "#f59e42", // deeper yellow/orange
  filter: "#14b8a6", // deeper mint/teal
  array: "#8b5cf6", // deeper purple
  number: "#ef4444", // deeper red
  pin: "#ea580c", // deeper orange
};
export interface SnapBuyProp {
  id: string;
  name?: string;
  type?: keyof SettingValueType;
  required?: boolean;
  storeId?: string;
  createdAt?: number;
  updatedAt?: number;
  uid?: string;
  config?: any;
  collectionId?: string; // Optional, used for collections
}
export interface SnapBuyCollection {
  id?: string;
  name?: string;
  storeId?: string;
  createdAt?: number;
  updatedAt?: number;
  uid?: string;
  type?: "product" | "order"; // Type of collection, can be product or order
}
export const OrderIndex = () => {
  const user = useUser();
  const storeId = useStoreId();
  const selectedCollection = getTemp<SnapBuyCollection | null>(
    "props-collection"
  );
  useAction(
    "add-prop",
    async (props: {
      name: string;
      type: keyof SettingValueType;
      required: boolean;
      config: any;
    }) => {
      const collectionId = selectedCollection?.id;
      if (!storeId) {
        return;
      }
      if (!user?.uid) {
        return;
      }
      const id = crypto.randomUUID();
      if (!props.name) {
        const message = "Property name is required";
        showToast(message);
        setFocused("form-prop-name");
        throw message;
      }
      if (!props.type) {
        const message = "Property type is required";
        showToast(message);
        setFocused("form-order-prop-type");
        throw message;
      }
      setFieldValue("form-prop-name", "");
      const option: SnapBuyProp = {
        id,
        storeId,
        uid: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: props.name,
        type: props.type,
        required: !!props.required,
        config: props.config || {},
        collectionId,
      };
      await snapbuyApi.forms.createProperty(option);
      execAction("fetch-props");
      showToast("New order property added successfully");
    },
    [user?.uid, storeId, selectedCollection?.id]
  );
  const {
    data: ordersProps,
    action,
    fetchInit,
  } = useFetchMoreAction<SnapBuyProp>(
    "fetch-props",
    10,
    async () => {
      if (!selectedCollection?.id) {
        return [];
      }
      const result = await snapbuyApi.forms.getCollectionPropertys(
        selectedCollection?.id
      );
      return result || [];
    },
    [storeId, selectedCollection]
  );
  useEffect(() => {
    if (user?.uid) {
      fetchInit();
    }
  }, [user, storeId, selectedCollection?.id]);
  useAction("delete-prop", async (props: { id: string }) => {
    if (!storeId) {
      return;
    }
    if (!user?.uid) {
      return;
    }
    await snapbuyApi.forms.deleteCollectionProperty(props.id);
    execAction("fetch-props");
  });
  const isDataLoadDone = isSuccess(action);
  const isDataLoading = isLoading(action);
  const isDark = useSettingValue("window/dark.boolean");
  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark, darkColors, lightColors]);
  return (
    <EmptyComponent>
      {isDataLoadDone && (
        <EmptyComponent>
          {!!ordersProps.get.length && (
            <Scroll>
              <div className="flex flex-col gap-2 p-2">
                {ordersProps.get.map((line) => {
                  const key = `${line.uid}-${line.name}-${line.type}`;
                  const color =
                    line.type && colors?.[line.type as keyof SettingValueType];
                  return (
                    <Card key={key}>
                      <div className="flex justify-between items-center p-3">
                        <span>{line.name}</span>
                        <div className="flex items-center gap-2">
                          <Key
                            style={{
                              backgroundColor: color ? color + "20" : undefined,
                              color,
                            }}
                          >
                            {line.type}
                          </Key>
                          <div>
                            <CircleTip
                              icon={allIcons.solid.faInfo}
                              onClick={() => {
                                showPopup(
                                  <Card className="max-md:rounded-none max-md:w-full md:w-[80vw] max-md:h-full md:max-h-[90vh] overflow-hidden">
                                    <CardHeaderForPopup title="Order Property Info" />
                                    <Line />
                                    <Scroll>
                                      <MarkDown
                                        value={
                                          "```json\n" +
                                          JSON.stringify(line.config, null, 2) +
                                          "\n```"
                                        }
                                      />
                                    </Scroll>
                                  </Card>
                                );
                              }}
                            />
                          </div>
                          <div>
                            <CircleTip
                              icon={allIcons.solid.faTrash}
                              onClick={async () => {
                                await execAction("delete-prop", {
                                  id: line.id,
                                });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Scroll>
          )}
          {!ordersProps.get.length && (
            <div className="flex flex-col justify-center items-center gap-2 text-[--biqpod-gray-opacity-2] w-full h-full">
              <Icon
                icon={allIcons.solid.faCircleExclamation}
                iconClassName="text-4xl max-md:text-3xl"
              />
              <p className="max-md:text-base text-lg text-center">
                <Translate content="no order properties found" />
              </p>
            </div>
          )}
        </EmptyComponent>
      )}
      {isDataLoading && (
        <div className="flex justify-center items-center w-full h-full">
          <CircleLoading />
        </div>
      )}
      <Line />
      <div className="flex justify-between p-4">
        <div className="max-md:hidden"></div>
        <Button
          className="rounded-full w-fit max-md:w-full"
          icon={allIcons.solid.faPlus}
          onClick={() => {
            showPopup(<UpsertProp collectionId={selectedCollection?.id} />);
          }}
        >
          <Translate content="add property" />
        </Button>
      </div>
    </EmptyComponent>
  );
};
