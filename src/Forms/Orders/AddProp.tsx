import { allIcons } from "@biqpod/app/ui/apis";
import {
  FullFieldProps,
  Card,
  CircleTip,
  Translate,
  Key,
  Line,
  Field,
  EnumField,
  Scroll,
  BooleanField,
  FullField,
  MagicField,
  Button,
  CardWait,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  getFieldValue,
  isLoading,
  closePopup,
  execAction,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { types } from "../../utils";
interface UpsertPropProps {
  propId?: string;
  collectionId?: string; // Optional, used for collections
}
export const UpsertProp = ({ propId: _id, collectionId }: UpsertPropProps) => {
  const propType = useCopyState<string | Nothing>(null);
  const isRequired = useCopyState<boolean | null>(false);
  const propName = getFieldValue("form-prop-name");
  const selectedType = types.find((t) => t.id === propType.get);
  const configState = useCopyState<FullFieldProps["state"]["get"]>({});
  const selectedId = selectedType?.id;
  const preparedConfig = useMemo<any>(() => {
    if (selectedId === "enum" || selectedId === "filter") {
      if (Array.isArray(configState.get.list)) {
        return {
          ...configState.get,
          list: configState.get.list.map((item) => ({
            content: item,
            value: item,
          })),
        };
      }
    }
    return configState.get;
  }, [configState.get, selectedId]);
  const loading = isLoading("add-prop");
  return (
    <Card className="w-[90vw] overflow-hidden">
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
          <h1 className="uppercase">
            <span className="font-bold max-md:text-xl md:text-2xl">
              <Translate content="add property" />{" "}
            </span>
            {selectedId && (
              <sub>
                <Key className="py-2">/ {selectedId}</Key>
              </sub>
            )}
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
          "relative transition-[height] overflow-hidden",
          selectedType && "h-[70vh]"
        )}
      >
        <div className="flex flex-col gap-2 p-2">
          <label className="capitalize" htmlFor="form-prop-name">
            <Translate content="name" /> :
          </label>
          <Field inputName="form-prop-name" placeholder="Enter Prop" />
        </div>
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
        {!loading && (
          <div
            className={tw(
              "absolute w-full flex flex-col bg-[--biqpod-secondary-background] inset-y-0 transition-[right] -right-full",
              selectedType && "right-0"
            )}
          >
            <Scroll>
              <div className="flex justify-center items-center gap-2 p-2">
                <label
                  className="capitalize"
                  htmlFor="form-order-prop-required"
                >
                  <Translate content="required" /> :
                </label>
                <BooleanField
                  state={isRequired}
                  id="form-order-prop-required"
                />
              </div>
              <Line />
              {selectedId === "range" && (
                <FullField
                  id="form-range-config"
                  config={{
                    list: {
                      min: {
                        type: "number",
                        label: "min",
                        config: {
                          placeholder: "Enter Min Value",
                          autoChange: true,
                        },
                      },
                      max: {
                        type: "number",
                        label: "max",
                        config: {
                          placeholder: "Enter Max Value",
                          autoChange: true,
                        },
                      },
                      steps: {
                        type: "number",
                        label: "steps",
                        config: {
                          placeholder: "Enter Steps Value",
                          autoChange: true,
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
                  state={configState}
                />
              )}
              {selectedId === "enum" && (
                <FullField
                  id="form-enum"
                  config={{
                    list: {
                      search: {
                        type: "boolean",
                        label: "search",
                        config: {},
                        icon: allIcons.solid.faMagnifyingGlass,
                      },
                      nullable: {
                        type: "boolean",
                        label: "nullable",
                        config: {},
                        icon: allIcons.solid.faCircleQuestion,
                      },
                      expandIcon: {
                        type: "boolean",
                        label: "expand",
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
                        config: {
                          separator: ",",
                        },
                        icon: allIcons.solid.faList,
                      },
                    },
                  }}
                  state={configState}
                />
              )}
              {selectedId === "array" && (
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
                  state={configState}
                />
              )}
              {selectedId === "number" && (
                <FullField
                  id="form-number-config"
                  config={{
                    list: {
                      autoChange: {
                        type: "boolean",
                        label: "Auto Change",
                        config: {},
                      },
                      placeholder: {
                        type: "string",
                        label: "Placeholder",
                        config: {
                          placeholder: "Enter Placeholder",
                          autoChange: true,
                        },
                      },
                    },
                  }}
                  state={configState}
                />
              )}
              {selectedId === "filter" && (
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
                  state={configState}
                />
              )}
              {selectedId === "boolean" && (
                <FullField
                  id="form-filter-config"
                  config={{
                    list: {
                      type: {
                        config: {
                          list: [
                            {
                              value: "switch",
                              content: "switch",
                            },
                            {
                              content: "check",
                              value: "check",
                            },
                          ],
                        },
                        label: "Type",
                        type: "enum",
                      },
                    },
                  }}
                  state={configState}
                />
              )}
              {selectedId === "pin" && (
                <FullField
                  id="form-filter-config"
                  config={{
                    list: {
                      match: {
                        config: {
                          placeholder: "eg (--.--)",
                          autoChange: true,
                        },
                        label: "Match",
                        type: "string",
                      },
                      separator: {
                        config: {
                          autoChange: true,
                          placeholder: "eg (.)",
                        },
                        label: "Separator",
                        type: "string",
                      },
                      cursor: {
                        config: {
                          placeholder: "eg (0)",
                          autoChange: true,
                        },
                        label: "Cursor",
                        type: "string",
                      },
                    },
                  }}
                  state={configState}
                />
              )}
              {selectedId && <Line />}
            </Scroll>
            <Line />
            <div className="bg-[--biqpod-primary-background]">
              <div className="p-4">
                <h1 className="text-lg capitalize">
                  <Translate content="playground" />
                </h1>
              </div>
              <Line />
              <div className="flex flex-col gap-4 p-4">
                <label>{propName} : </label>
                {selectedId && (
                  <MagicField
                    fieldId={`exmple-${selectedId}`}
                    type={selectedId}
                    config={preparedConfig}
                  />
                )}
              </div>
            </div>
            <Line />
            <div className="p-2">
              <Button
                onClick={async () => {
                  await execAction("add-prop", {
                    name: propName,
                    type: propType.get,
                    required: isRequired.get,
                    config: preparedConfig,
                    collectionId,
                  });
                  closePopup();
                }}
                className="rounded-full"
                icon={allIcons.solid.faPlus}
              >
                <Translate content="add" />
              </Button>
            </div>
          </div>
        )}
        {loading && (
          <div
            className={tw(
              "absolute w-full flex flex-col p-2 gap-2 bg-[--biqpod-secondary-background] inset-0"
            )}
          >
            <CardWait className="rounded-full w-1/2 h-[60px]" />
            <CardWait className="rounded-full w-2/3 h-[60px]" />
            <CardWait className="rounded-full w-full h-[180px]" />
          </div>
        )}
      </div>
    </Card>
  );
};
