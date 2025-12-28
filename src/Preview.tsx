import { allIcons } from "@biqpod/app/ui/apis";
import { Card, Icon, Translate } from "@biqpod/app/ui/components";
import { MediaShowContentPreview } from "./Links/NewProduct/Views/MediaShowContentPreview";

export const Preview = () => {
  const search = new URLSearchParams(window.location.search);
  const url = search.get("url")?.toString();
  const type = search.get("type")?.toString();
  if (url && type) {
    return (
      <div className="flex justify-center items-center w-full h-full">
        <MediaShowContentPreview
          mediaFile={{
            type,
            url,
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex justify-center items-center h-full">
      <Card>
        <div className="p-6 max-w-[500px]">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full text-[--biqpod-primary]">
              <span className="text-4xl">
                <Icon icon={allIcons.solid.faInfoCircle} />
              </span>
            </div>
          </div>
          <h2 className="mb-4 font-bold text-2xl text-center">
            <Translate content="Preview Parameters Required" />
          </h2>
          <p className="text-[--biqpod-gray-opacity-2] mb-4 text-center">
            <Translate content="To preview media content, please provide the following query parameters:" />
          </p>
          <div className="space-y-3 bg-[--biqpod-secondary-background] mb-4 p-4 rounded-lg">
            <div>
              <span className="font-semibold text-[--biqpod-primary]">url</span>
              <span className="text-[--biqpod-gray-opacity-2]">
                {" "}
                - The URL of the media file
              </span>
            </div>
            <div>
              <span className="font-semibold text-[--biqpod-primary]">
                type
              </span>
              <span className="text-[--biqpod-gray-opacity-2]">
                {" "}
                - The file type/extension
              </span>
            </div>
          </div>
          <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
            <p className="font-mono text-sm break-all">
              /preview?url=https://example.com/file.glb&type=glb
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
