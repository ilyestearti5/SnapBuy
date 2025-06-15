import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
import {
  Line,
  Scroll,
  Button,
  Card,
  Translate,
  CircleTip,
  Field,
  EnumField,
  BooleanField,
  FullFieldProps,
  FullField,
} from "@biqpod/app/ui/components";
import {
  showPopup,
  closePopup,
  useCopyState,
  useUser,
  useAction,
  showToast,
  execAction,
  getFieldValue,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { types, useFetchMoreAction } from "../../utils";
import { useEffect } from "react";
import { createDoc, getDocs } from "../../server";
import { useStoreId } from "../../App";
import { setFocused, tw } from "@biqpod/app/ui/utils";
const AddProp = () => {
  const propType = useCopyState<string | Nothing>(null);
  const isRequired = useCopyState<boolean | null>(false);
  const name = getFieldValue("form-order-prop");
  const selectedType = types.find((t) => t.id === propType.get);
  const state = useCopyState<FullFieldProps["state"]["get"]>({});
  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center p-3 min-w-[350px]">
        <div className="flex items-center gap-2">
          {selectedType && (
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                propType.set(null);
              }}
            />
          )}
          <h1 className="font-bold text-2xl uppercase">
            <Translate content="add property" />
          </h1>
        </div>
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
      <div
        className={tw(
          "relative transition-[height]",
          selectedType && "h-[70vh]"
        )}
      >
        <div className="flex flex-col gap-2 p-2">
          <label className="capitalize" htmlFor="form-order-prop-type">
            <Translate content="type" /> :
          </label>
          <EnumField
            state={propType}
            id="form-order-prop-type"
            config={{
              list: types.map((t) => {
                return {
                  value: t.id,
                  content: t.name,
                  description: t.description,
                };
              }),
              search: true,
            }}
          />
        </div>
        <div
          className={tw(
            "absolute w-full flex flex-col bg-[--biqpod-secondary-background] inset-y-0 transition-[right] -right-full",
            selectedType && "right-0"
          )}
        >
          <Scroll>
            <div className="flex flex-col gap-2 p-2">
              <label className="capitalize" htmlFor="form-order-prop-name">
                <Translate content="name" /> :
              </label>
              <Field inputName="form-order-prop" placeholder="Enter Prop" />
            </div>
            <div className="flex justify-center items-center gap-2 p-2">
              <label className="capitalize" htmlFor="form-order-prop-required">
                <Translate content="required" /> :
              </label>
              <BooleanField state={isRequired} id="form-order-prop-required" />
            </div>
            <Line />
            {selectedType?.id === "range" && (
              <FullField
                id="form-range-config"
                config={{
                  list: {
                    min: {
                      type: "number",
                      label: "min",
                      config: {
                        placeholder: "Enter Min Value",
                      },
                    },
                    max: {
                      type: "number",
                      label: "max",
                      config: {
                        placeholder: "Enter Max Value",
                      },
                    },
                    steps: {
                      type: "number",
                      label: "steps",
                      config: {
                        placeholder: "Enter Steps Value",
                      },
                    },
                    showValue: {
                      type: "boolean",
                      label: "show value",
                      config: {},
                    },
                    isFloat: {
                      type: "boolean",
                      label: "is float",
                      config: {},
                    },
                  },
                }}
                state={state}
              />
            )}
            {selectedType?.id === "enum" && (
              <FullField
                id="form-enum"
                config={{
                  list: {
                    search: {
                      type: "boolean",
                      label: "Search",
                      config: {},
                      icon: allIcons.solid.faMagnifyingGlass,
                    },
                    nullable: {
                      type: "boolean",
                      label: "Nullable",
                      config: {},
                      icon: allIcons.solid.faCircleQuestion,
                    },
                    expandIcon: {
                      type: "boolean",
                      label: "Expand Icon",
                      config: {},
                      icon: allIcons.solid.faExpand,
                    },
                    placeholder: {
                      type: "string",
                      label: "Placeholder",
                      config: {
                        placeholder: "Enter Placeholder",
                      },
                      icon: allIcons.regular.faCircleQuestion,
                    },
                    list: {
                      type: "array",
                      label: "Enum",
                      config: {},
                      icon: allIcons.solid.faList,
                    },
                  },
                }}
                state={state}
              />
            )}
            {selectedType?.id === "array" && (
              <FullField
                id="form-array-config"
                config={{
                  list: {
                    addText: {
                      type: "string",
                      label: "Add Text",
                      config: {
                        placeholder: "Enter Add Text",
                      },
                    },
                    separator: {
                      type: "string",
                      label: "Separator",
                      config: {
                        placeholder: "Enter Separator",
                      },
                    },
                  },
                }}
                state={state}
              />
            )}
            {selectedType?.id === "number" && (
              <FullField
                id="form-number-config"
                config={{
                  list: {},
                }}
                state={state}
              />
            )}
            {selectedType?.id === "filter" && (
              <FullField
                id="form-filter-config"
                config={{
                  list: {
                    list: {
                      type: "array",
                      label: "Filter List",
                      config: {
                        placeholder: "Enter Filter List",
                      },
                    },
                  },
                }}
                state={state}
              />
            )}
          </Scroll>
          <Line />
          <div className="p-2">
            <Button
              onClick={async () => {
                await execAction("add-order-prop", {
                  name,
                  type: propType.get,
                  required: isRequired.get,
                });
              }}
              className="rounded-full"
              icon={allIcons.solid.faPlus}
            >
              <Translate content="add" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
export interface OrderProp {
  id: string;
  name?: string;
  type?: string;
  required?: boolean;
  storeId?: string;
  createdAt?: number;
  updatedAt?: number;
  uid?: string;
}
export const OrderIndex = () => {
  const user = useUser();
  const storeId = useStoreId();
  useAction(
    "add-order-prop",
    async (props: { name: string; type: string; required: boolean }) => {
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
        setFocused("form-order-prop-name");
        throw message;
      }
      if (!props.type) {
        const message = "Property type is required";
        showToast(message);
        setFocused("form-order-prop-type");
        throw message;
      }
      const option: OrderProp = {
        id,
        storeId,
        uid: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: props.name,
        type: props.type,
        required: !!props.required,
      };
      await createDoc(
        ["projects", import.meta.env.VITE_PROJECT_ID, "order-props"],
        option
      );
      execAction("fetch-order-props");
      showToast("New order property added successfully");
    },
    [user?.uid, storeId]
  );
  const { data, hasMore, action, fetchInit, fetchMore } =
    useFetchMoreAction<OrderProp>(
      "fetch-order-props",
      10,
      async ({ next, lastDoc }) => {
        if (!storeId) {
          return [];
        }
        if (!user?.uid) {
          return [];
        }
        const startAt = next && lastDoc ? lastDoc.createdAt : undefined;
        const result = await getDocs(
          ["projects", import.meta.env.VITE_PROJECT_ID, "order-props"],
          {
            where: and(where("storeId", "==", storeId)),
            orders: [orderBy("createdAt", "desc")],
            startAt: startAt ? [startAt] : undefined,
          }
        );
        return result?.map(({ data, id }) => {
          return {
            ...data,
            id,
          };
        });
      },
      [user, storeId]
    );
  useEffect(() => {
    fetchInit();
  }, []);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll>
        <div className="flex flex-col gap-2 p-2">
          {data.get.map((line) => {
            const key = `${line.uid}-${line.name}-${line.type}`;
            return <Card key={key}></Card>;
          })}
          {hasMore.get && (
            <div className="flex justify-center items-center p-2">
              <Button
                className="w-fit"
                icon={
                  action?.status === "loading"
                    ? allIcons.solid.faSpinner
                    : allIcons.solid.faPlus
                }
                onClick={() => {
                  fetchMore();
                }}
              >
                <Translate content="load more" />
              </Button>
            </div>
          )}
        </div>
      </Scroll>
      <Line />
      <div className="flex justify-between p-2">
        <div className="max-md:hidden"></div>
        <Button
          className="w-fit max-md:w-full"
          icon={allIcons.solid.faPlus}
          onClick={() => {
            showPopup(<AddProp />);
          }}
        >
          <Translate content="add property" />
        </Button>
      </div>
    </div>
  );
};
