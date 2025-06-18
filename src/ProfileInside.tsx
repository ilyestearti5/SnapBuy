import { useTemp } from "@biqpod/app/ui/hooks";
export const ProfileInside = () => {
  const loadingPercent = useTemp<number>("loading-percent");
  const loadingText = useTemp<string>("loading-text");
  return (
    <div className="flex flex-col justify-center items-center h-full">
      {loadingText.get && !!loadingPercent.get && (
        <div className="absolute inset-[0px] flex justify-center items-center">
          <svg width="w-full" height="100" viewBox="0 0 100 100">
            <circle
              cx="100"
              cy="100"
              r="50"
              fill="none"
              stroke="var(--biqpod-primary)"
              strokeWidth="4"
              strokeDasharray={Math.PI * 2 * 20}
              strokeDashoffset={
                Math.PI * 2 * 20 * (1 - loadingPercent.get / 100)
              }
              style={{ transition: "stroke-dashoffset 0.3s" }}
            />
          </svg>
        </div>
      )}
    </div>
  );
};
