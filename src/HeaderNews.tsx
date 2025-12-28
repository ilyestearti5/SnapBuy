import {
  Card,
  CardHeaderForPopup,
  CircleLoading,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useAsyncMemo, closePopup } from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { useHistory } from "react-router";
import { snapbuyApi } from "./apis";

export const HeaderNews = () => {
  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
    if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };
  const newsData = useAsyncMemo(async () => {
    const news = await snapbuyApi.getNews();
    return news;
  }, []);
  const hist = useHistory();
  return (
    <Card className="w-11/12 max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup title="News" />
      <Line />
      {!!newsData?.length && (
        <Scroll>
          {newsData?.map((news, index) => (
            <div
              key={news.id}
              className={tw(
                "p-4 cursor-pointer hover:bg-[--biqpod-gray-opacity] transition-colors",
                index && "border-[--biqpod-borders] border-solid border-t"
              )}
              onClick={() => {
                hist.push("/news/" + news.id);
                closePopup();
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-xl">{news.title}</h3>
                  <p className="opacity-70 mt-1 text-xs">{news.description}</p>
                  <small className="block opacity-50 mt-2 text-xs">
                    {timeAgo(news.createdAt)}
                  </small>
                </div>
                <img src={news.photo} alt="" className="rounded h-[80px]" />
              </div>
            </div>
          ))}
        </Scroll>
      )}
      {newsData?.length == 0 && (
        <div className="flex justify-center items-center h-[350px]">
          <p className="p-4 capitalize">
            <Translate content="No news found." />
          </p>
        </div>
      )}
      {newsData === null && (
        <div className="flex justify-center items-center h-[350px]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
