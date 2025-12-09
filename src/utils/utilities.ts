import {
  execAction,
  getTemp,
  getTempFromStore,
  setTemp,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { useMemo } from "react";
import { useLocation } from "react-router";
import { mergeArray } from "@biqpod/app/ui/utils";
export const toId = (value: string) => {
  return value.toLowerCase().replaceAll(/( |\.)+/gi, "-");
};
/**
 * Compress image and return Base64 DataURL
 * @param imageUrl string - URL or Base64 of the image
 * @param quality number - between 0 and 1 (lower = smaller file)
 * @param maxWidth number - maximum width in pixels (default: 1200)
 * @param maxHeight number - maximum height in pixels (default: 1200)
 * @returns Promise<string> - Base64 Data URL of compressed image
 */
export async function compressImage(
  imageUrl: string,
  quality: number = 0.7,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // allow external images
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context");
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      // Export as JPEG with given quality
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
export const getStringTimeLeave = (from: Date | number, to: Date | number) => {
  const fromTime = new Date(from);
  const toTime = new Date(to);
  const timeDifference = Math.floor(
    (toTime.getTime() - fromTime.getTime()) / 1000
  );
  let time = "";
  if (timeDifference < 60) {
    time = `${timeDifference} sec${timeDifference > 1 ? "s" : ""}`;
  } else if (timeDifference < 3600) {
    const minutes = Math.floor(timeDifference / 60);
    time = `${minutes} min${minutes > 1 ? "s" : ""}`;
  } else if (timeDifference < 86400) {
    const hours = Math.floor(timeDifference / 3600);
    time = `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (timeDifference < 604800) {
    const days = Math.floor(timeDifference / 86400);
    time = `${days} day${days > 1 ? "s" : ""}`;
  } else if (timeDifference < 2419200) {
    const weeks = Math.floor(timeDifference / 604800);
    time = `${weeks} week${weeks > 1 ? "s" : ""}`;
  } else if (timeDifference < 29030400) {
    const months = Math.floor(timeDifference / 2419200);
    time = `${months} month${months > 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(timeDifference / 29030400);
    time = `${years} year${years > 1 ? "s" : ""}`;
  }
  return time;
};
export const useSub = () => {
  return getTemp<
    {
      isSubscribed: boolean;
    } & Biqpod.Account.Payout
  >("subed");
};
export const initStoreIdSave = () => {
  const loc = useLocation();
  return useMemo(() => {
    if (loc.pathname.startsWith("/store/")) {
      const storeId = loc.pathname.split("/").at(2);
      setTemp("storeId", storeId);
    } else {
      setTemp("storeId", null);
    }
  }, [loc.pathname]);
};
export let initialHeight = window.innerHeight;
export const isAndroidWeb = navigator.userAgent.match(
  /Android.*(wv|Chrome)\/(\d+)\.(\d+)(?:\.(\d+))?/gi
);
export const useClientStoreId = () => {
  return getTemp<string>("client-store-id");
};
export function useFetchMoreAction<T>(
  actionName: string,
  PAGE_SIZE: number,
  callback: (props: {
    next: boolean;
    lastDoc: T | null;
    hasMore: boolean;
    PAGE_SIZE: number;
  }) => Promise<T[] | Nothing>,
  deps: any[] = []
) {
  const data = useCopyState<T[]>([]); // Replace with your actual product data
  const lastDoc = useCopyState<T | null>(null);
  const hasMore = useCopyState(true);
  const action = useAction(
    actionName,
    async (next = false) => {
      const list = await callback({
        next,
        lastDoc: lastDoc.get,
        hasMore: hasMore.get,
        PAGE_SIZE,
      });
      if (!list) {
        return;
      }
      data.set((prev) => (next ? [...prev, ...list] : list));
      const lastDocRef = list.at(-1);
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(list.length === PAGE_SIZE);
    },
    [...deps, lastDoc.get, hasMore.get]
  );
  return {
    data,
    lastDoc,
    hasMore,
    action,
    fetchMore() {
      execAction(actionName, true);
    },
    fetchInit() {
      execAction(actionName, false);
    },
  };
}
export interface ConfigForm<T extends keyof Biqpod.System.Setting.Config> {
  value: Biqpod.System.Setting.Config[T];
  onChange: (value: Biqpod.System.Setting.Config[T]) => void;
}
export const getPrice = (
  product?: Biqpod.Snapbuy.Product | Nothing,
  count = 1
) => {
  var total = 0;
  var choised:
    | null
    | Required<Required<Biqpod.Snapbuy.Product>["multiple"]>["prices"][number] =
    null;
  var price: null | number = null;
  if (!product) {
    return {
      total,
      choised,
      price,
    };
  }
  if (product.type === "multiple") {
    var prices = mergeArray(product.multiple?.prices).flat();
    choised =
      prices
        ?.sort((a, b) => {
          return b.quantity - a.quantity;
        })
        ?.find((price) => price.quantity <= count) || null;
    price = choised?.price || 0;
    total = price * count;
  } else {
    price = product.single?.client || 0;
    total = price * count;
  }
  return {
    total,
    price,
    choised,
  };
};
export const useStoreId = () => {
  return getTemp<string>("storeId");
};
export const getStoreId = () => {
  return getTempFromStore<string>("storeId");
};
/**
 * Create an object URL from a file for memory-efficient handling
 * @param file File - The file to create an object URL for
 * @returns string - Object URL that should be revoked when no longer needed
 */
export const createObjectURL = (file: File): string => {
  return URL.createObjectURL(file);
};
/**
 * Revoke an object URL to free up memory
 * @param url string - The object URL to revoke
 */
export const revokeObjectURL = (url: string): void => {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};
/**
 * Check if a URL is an object URL (blob:)
 * @param url string - URL to check
 * @returns boolean - true if it's an object URL
 */
export const isObjectURL = (url: string): boolean => {
  return url.startsWith("blob:");
};
/**
 * Get file type from File object or URL
 * @param fileOrUrl File | string - File object or URL string
 * @returns 'image' | 'gltf' | 'unknown'
 */
/**
 * Interface for media file with metadata
 */
export interface MediaFile {
  url: string;
  name: string;
  size: number;
  originalFile?: File;
  compressed?: boolean; // For images that have been compressed
}
/**
 * Create a MediaFile object from a File
 * @param file File - The file to create MediaFile from
 * @param compressed boolean - Whether the file has been compressed (for images)
 * @returns MediaFile
 */
export const createMediaFile = (
  file: File,
  compressed: boolean = false
): MediaFile => {
  const url = createObjectURL(file);
  return {
    url,
    name: file.name,
    size: file.size,
    originalFile: file,
    compressed,
  };
};
/**
 * Create a MediaFile object from a URL (for existing images/URLs)
 * @param url string - The URL
 * @param name string - Optional name
 * @returns MediaFile
 */
export const createMediaFileFromURL = (
  url: string,
  name?: string
): MediaFile => {
  return {
    url,
    name: name || url.split("/").pop() || "Unknown",
    size: 0, // Unknown for URLs
    compressed: false,
  };
};
/**
 * Clean up MediaFile by revoking object URL if needed
 * @param mediaFile MediaFile - The media file to clean up
 */
export const cleanupMediaFile = (mediaFile: MediaFile): void => {
  revokeObjectURL(mediaFile.url);
};
/**
 * Clean up multiple MediaFiles
 * @param mediaFiles MediaFile[] - Array of media files to clean up
 */
export const cleanupMediaFiles = (mediaFiles: MediaFile[]): void => {
  mediaFiles.forEach(cleanupMediaFile);
};
