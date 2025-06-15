import { allIcons } from "@biqpod/app/ui/apis";
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
} from "@biqpod/app/ui/components";
import { showPopup, closePopup, useCopyState } from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { types } from "../../utils";
const AddProp = () => {
  const propType = useCopyState<string | Nothing>(null);
  const isRequired = useCopyState<boolean | null>(false);
  return (
    <Card>
      <div className="flex justify-between items-center p-3 min-w-[350px]">
        <h1 className="font-bold text-2xl uppercase">
          <Translate content="add property" />
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
      <div className="flex flex-col gap-2 p-2">
        <label className="capitalize" htmlFor="form-product-prop-name">
          <Translate content="name" /> :
        </label>
        <Field inputName="form-product-prop" placeholder="Enter Prop" />
      </div>
      <div className="flex flex-col gap-2 p-2">
        <label className="capitalize" htmlFor="form-product-prop-type">
          <Translate content="type" /> :
        </label>
        <EnumField
          state={propType}
          id="form-product-prop-type"
          config={{
            list: types.map((t) => {
              return {
                value: t.id,
                content: t.name,
                description: t.description,
              };
            }),
          }}
        />
      </div>
      <div className="flex justify-center items-center gap-2 p-2">
        <label className="capitalize" htmlFor="form-product-prop-required">
          <Translate content="required" /> :
        </label>
        <BooleanField state={isRequired} id="form-product-prop-required" />
      </div>
      <Line />
      <div className="p-2">
        <Button
          onClick={async () => {}}
          className="rounded-full"
          icon={allIcons.solid.faPlus}
        >
          <Translate content="add" />
        </Button>
      </div>
    </Card>
  );
};
export const ProductIndex = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll></Scroll>
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
