import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Field,
  Line,
  Scroll,
} from "@biqpod/app/ui/components";
import { getFieldValue, showSetting } from "@biqpod/app/ui/hooks";
import { SettingValueType } from "@biqpod/app/ui/types";
import { include, mergeObject } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { settings } from "./server";
const colors: Partial<Record<keyof SettingValueType, string>> = {
  string: "#1E90FF", // DodgerBlue
  number: "#32CD32", // LimeGreen
  boolean: "#8A2BE2", // BlueViolet
  date: "#FFA500", // Orange
  array: "#20B2AA", // LightSeaGreen
  object: "#A52A2A", // Brown
};
export const SettingsPage = () => {
  const searchSetting = getFieldValue("search-setting");
  const filteredSettings = useMemo(() => {
    return settings.filter((setting) => include(setting.name, searchSetting));
  }, [searchSetting]);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3">
        <Field
          inputName="search-setting"
          className="rounded-xl"
          placeholder="search settings"
        />
      </div>
      <Line />
      <Scroll>
        <div className="flex flex-col gap-2 p-2">
          {filteredSettings?.map((setting) => {
            const type = setting.settingId.split(".").at(-1);
            const color = colors[type as keyof SettingValueType];
            return (
              <Card
                key={setting.settingId}
                onClick={() => {
                  showSetting(setting.settingId);
                }}
                className="active:bg-[--biqpod-gray-opacity] cursor-pointer"
              >
                <div className="flex justify-between items-center gap-2 px-4 py-1">
                  <span>
                    {setting.name}
                    <sub
                      style={{
                        ...mergeObject({
                          backgroundColor: color + "22",
                          color,
                        }),
                      }}
                      className="bg-[--biqpod-gray-opacity] ml-2 px-2 py-[2px] rounded-full uppercase"
                    >
                      {type}
                    </sub>
                  </span>
                  <div>
                    <CircleTip icon={allIcons.solid.faChevronRight} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Scroll>
    </div>
  );
};
