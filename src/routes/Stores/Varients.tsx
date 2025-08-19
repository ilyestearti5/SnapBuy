import {
  AsyncComponent,
  BooleanField,
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  CircleTip,
  EmptyComponent,
  Field,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  isLoading,
  isSuccess,
  setFieldValue,
  showPopup,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { snapbuyApi } from "../../apis";
import { range, tw } from "@biqpod/app/ui/utils";
import { allIcons } from "@biqpod/app/ui/apis";
interface UpsertVarientProps {
  varient?: SnapBuy.Varient;
}
export const UpsertVarient = ({ varient }: UpsertVarientProps) => {
  const name = getFieldValue("varient-name");
  const expr = getFieldValue("varient-expression");
  const isPublic = useCopyState<boolean | null>(false);
  const action = useAction(
    "upsert-varient",
    async () => {
      if (!name) {
        showToast("Please enter varient name", "error");
        return;
      }
      if (!expr) {
        showToast("Please enter varient expression", "error");
        return;
      }
      if (varient?.id) {
        await snapbuyApi.varient.update(varient.id, {
          ...varient,
          name: name,
        });
        showToast("Varient updated successfully", "success");
      } else {
        await snapbuyApi.varient.add({
          name: name,
          status: isPublic.get ? "public" : "private",
          expression: expr,
        });
        showToast("Varient added successfully", "success");
      }
      closePopup();
      execAction("fetch-varients");
    },
    [name, varient, isPublic.get, expr]
  );
  const loading = isLoading(action);
  useEffect(() => {
    if (varient?.name) {
      setFieldValue("varient-name", varient.name || "");
    }
  }, [varient]);
  const props = ["price"];
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full overflow-hidden">
      <CardHeaderForPopup title={varient ? "Edit Varient" : "Add Varient"} />
      <Line />
      <Scroll>
        <div className="p-3">
          <Field inputName="varient-name" placeholder="Enter Varient Name" />
        </div>
        <div className="p-3">
          <Field
            inputName="varient-expression"
            placeholder="Enter Expression"
            propositions={[...props]}
            heighlight={[
              {
                reg: "price",
                name: "Pricing",
                render(content) {
                  return (
                    <span className="rounded-md text-[--biqpod-primary] underline underline-[--biqpod-primary]">
                      {content}
                    </span>
                  );
                },
              },
            ]}
          />
        </div>
        <div className="flex justify-between items-center gap-3 p-3">
          <label className="block w-full text-right">
            <Translate content="be public" /> :
          </label>
          <div className="w-full">
            <BooleanField state={isPublic} id="varient-public" config={{}} />
          </div>
        </div>
      </Scroll>
      <Line />
      <div className="flex justify-end gap-2 p-2">
        <Button
          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          onClick={() => {
            closePopup();
          }}
        >
          <Translate content="cancel" />
        </Button>
        <Button
          icon={
            loading
              ? allIcons.solid.faSpinner
              : varient
              ? allIcons.solid.faPen
              : allIcons.solid.faPlus
          }
          iconClassName={tw(loading && "animate-spin")}
          onClick={() => {
            execAction("upsert-varient");
          }}
        >
          <Translate content={loading ? "loading" : "create"} />
        </Button>
      </div>
    </Card>
  );
};
export const Varients = () => {
  const varients = useCopyState<SnapBuy.Varient[]>([]);
  const varientAction = useAction(
    "fetch-varients",
    async () => {
      const result = await snapbuyApi.varient.getList();
      varients.set(result);
    },
    []
  );
  const loading = isLoading(varientAction);
  const success = isSuccess(varientAction);
  useEffect(() => {
    execAction("fetch-varients");
  }, []);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll>
        <div className="flex flex-col gap-2 p-2">
          {success &&
            varients.get.map((varient) => {
              return (
                <Card key={varient.id}>
                  <div className="flex justify-between items-center p-3">
                    <div className="flex flex-col gap-2">
                      <span className="font-bold text-lg">{varient.name}</span>
                      <span>
                        {varient.id && (
                          <AsyncComponent
                            render={async () => {
                              const count =
                                await snapbuyApi.varient.getUsedByProducts(
                                  varient.id!
                                );
                              return <EmptyComponent>{count}</EmptyComponent>;
                            }}
                            loading={
                              <CardWait className="rounded-full w-full h-[50px]" />
                            }
                          />
                        )}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <div>
                        <CircleTip
                          icon={allIcons.solid.faTrash}
                          onClick={async () => {
                            if (!varient.id) {
                              return;
                            }
                            const response = await confirm({
                              title: "Delete Varient",
                              message: `Are you sure you want to delete the varient \`${varient.name}\`?"`,
                            });
                            if (response) {
                              await snapbuyApi.varient.delete(varient.id);
                              showToast(
                                "Varient deleted successfully",
                                "success"
                              );
                              execAction("fetch-varients");
                            }
                          }}
                        />
                      </div>
                      <div>
                        <CircleTip
                          icon={allIcons.solid.faPen}
                          onClick={() => {
                            showPopup(<UpsertVarient varient={varient} />);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          {loading &&
            range(10).map((index) => {
              return (
                <CardWait
                  key={index}
                  className="rounded-2xl w-full h-[120px]"
                />
              );
            })}
        </div>
        {success && !varients.get.length && (
          <div className="flex justify-center items-center w-full h-full">
            <Card>
              <div className="p-3 capitalize">
                <Translate content="no products ther is" />
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
            showPopup(<UpsertVarient />);
          }}
          icon={allIcons.solid.faPlus}
        >
          <Translate content="create varient" />
        </Button>
      </div>
    </div>
  );
};
