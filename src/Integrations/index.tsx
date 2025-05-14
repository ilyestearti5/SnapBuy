import {
  fieldHooks,
  getTemp,
  getTempFromStore,
  setTemp,
  showToast,
  useAsyncMemo,
  useColorMerge,
  useCopyState,
  useUser,
} from "@biqpod/app/ui/hooks";
import { cloud, getDocs, getDownloadURL, setDoc, uploadFile } from "../server";
import {
  Card,
  CircleTip,
  ClickedView,
  EmptyComponent,
  Field,
  Icon,
  IconProps,
  ImageFeild,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { Nothing } from "@biqpod/app/ui/types";
import { include, mergeArray, tw } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
export interface SingleDocument {
  name?: string;
  photo?: string;
  type?: "camera" | "service";
  camera?: Partial<{
    photo: string;
  }>;
  service?: Partial<{}>;
  id?: string;
}
interface DocumentForUser {
  id: string;
  type?: "camera" | "service";
  status: "pending" | "accepted" | "rejected" | "idle";
  camera?: Partial<{
    photo: string;
  }>;
  service?: Partial<{}>;
}
interface DocumentRecordProps {
  data: SingleDocument;
}
export const statusColors: Partial<Record<DocumentForUser["status"], string>> =
  {
    rejected: "#e74c3c", // Beautiful red for failed status
    pending: "#f39c12", // Warm orange for pending status
    accepted: "#2ecc71", // Vibrant green for paid status,
  };
export const statusIcons: Partial<
  Record<DocumentForUser["status"], IconProps["icon"]>
> = {
  rejected: allIcons.solid.faWarning,
  pending: allIcons.solid.faClock,
  accepted: allIcons.solid.faCheckCircle, // Added icon for 'paid' status,
};
export const statusText: Partial<Record<DocumentForUser["status"], string>> = {
  rejected: "rejected",
  pending: "pending",
  accepted: "accepted",
};
export const DocumentRecord = ({ data }: DocumentRecordProps) => {
  const { name, type = "camera", photo, id } = data;
  const cameraId = `state-${name}-camera`;
  const state = useCopyState<string | Nothing>(null);
  const colorMerge = useColorMerge();
  const user = useUser();
  const savedDocuments = getTemp<DocumentForUser[]>("saved-docs");
  const doc = useMemo(() => {
    return savedDocuments?.find((doc) => doc.id === id);
  }, [savedDocuments]);
  const loading = useCopyState(false);
  return (
    <Card
      key={name}
      style={{
        ...colorMerge("secondary.background"),
      }}
      className="w-[calc(50%-6px)] max-md:w-full h-fit overflow-hidden"
    >
      <ClickedView>
        <div className="flex flex-col justify-between">
          <div className="flex justify-center">
            <img
              className="h-[150px] object-cover"
              src={photo}
              draggable={false}
            />
          </div>
          <Line />
          <div className="flex justify-between items-center p-3">
            <h1 className="text-3xl capitalize">
              <Translate content={name || "no name"} />
            </h1>
            {(!doc || doc?.status === "idle") && (
              <div className="flex justify-end gap-2">
                {type === "service" && (
                  <CircleTip
                    onClick={async () => {
                      const url = new URL("https://water-fetch-api.web.app");
                      const token = await cloud.app.auth.generateToken();
                      if (!token) {
                        showToast("Failed to generate token");
                        return;
                      }
                      url.pathname = "/document";
                      url.searchParams.append("token", token);
                      url.searchParams.append("name", id!);
                      const a = document.createElement("a");
                      a.href = url.toString();
                      a.target = "_blank";
                      a.click();
                    }}
                    icon={allIcons.solid.faChevronRight}
                  />
                )}
                {type === "camera" && (
                  <EmptyComponent>
                    <CircleTip
                      onClick={() => {
                        document.getElementById(cameraId)?.click();
                      }}
                      icon={allIcons.solid.faCamera}
                    />
                    {state.get && (
                      <CircleTip
                        onClick={async () => {
                          if (!user?.uid) {
                            showToast("You are not logged in");
                            return;
                          }
                          if (!state.get) {
                            showToast("No image found");
                            return;
                          }
                          loading.set(true);
                          try {
                            const ref = ["users", user.uid, "documents", id!];
                            const blob = await fetch(state.get).then((s) =>
                              s.blob()
                            );
                            await uploadFile(ref, blob);
                            const photo = await getDownloadURL(ref);
                            await setDoc(ref, {
                              status: "pending",
                              type: "camera",
                              camera: {
                                photo,
                              },
                            });
                          } catch {}
                          loading.set(false);
                          showToast("Document sent for verification");
                        }}
                        iconClassName={tw(loading.get && "animate-spin")}
                        icon={
                          loading.get
                            ? allIcons.solid.faSpinner
                            : allIcons.solid.faPaperPlane
                        }
                      />
                    )}
                    <ImageFeild
                      state={state}
                      config={{
                        hidden: true,
                      }}
                      id={cameraId}
                    />
                  </EmptyComponent>
                )}
              </div>
            )}
            {doc && doc.status !== "idle" && (
              <div
                style={{
                  color: statusColors[doc.status],
                }}
                className="flex justify-center items-center gap-2 text-3xl capitalize"
              >
                <Icon icon={statusIcons[doc.status]} />
              </div>
            )}
          </div>
        </div>
      </ClickedView>
    </Card>
  );
};
export const Integrations = () => {
  const documents = useAsyncMemo(async () => {
    const cashedDocs = getTempFromStore<SingleDocument[]>("documents");
    if (cashedDocs) return cashedDocs;
    const docs = await getDocs<SingleDocument>(["documents"]);
    const list = docs?.map((doc) => ({
      ...doc.data,
      id: doc.id,
    }));
    setTemp("documents", list);
    return list;
  }, []);
  const searchDocValue = fieldHooks.getOneFeild("search-doc", "value");
  const filterdDocuments = useMemo(() => {
    const docs = mergeArray(documents).flat();
    if (!searchDocValue) {
      return docs;
    }
    return docs.filter((doc) => include(doc.name, searchDocValue));
  }, [documents, searchDocValue]);
  const enumState = useCopyState<string | Nothing>(null);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3">
        <Field
          inputName="search-doc"
          className="rounded-xl"
          placeholder="search document"
        />
      </div>
      <Line />
      <Scroll>
        <div className="flex flex-wrap gap-2 p-2">
          {filterdDocuments?.map((document) => {
            return <DocumentRecord data={document} key={document.id} />;
          })}
        </div>
      </Scroll>
    </div>
  );
};
