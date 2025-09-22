import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { setSettingValue } from "@biqpod/app/ui/hooks";

export const useUrlSettings = () => {
  const location = useLocation();

  const handleUrlSettings = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const lang = searchParams.get("lang");
    const dark = searchParams.get("dark");

    if (lang) {
      setSettingValue("window/lang.enum", lang);
    }

    if (typeof dark === "string") {
      setSettingValue("window/dark.boolean", dark === "true");
    }
  }, [location.search]);

  useEffect(() => {
    handleUrlSettings();
  }, [handleUrlSettings]);
};
