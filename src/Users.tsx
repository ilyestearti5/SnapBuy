import { allIcons, orderBy } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  Icon,
  Image,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  execAction,
  isLoading,
  showProfile,
  useAction,
  useAsyncEffect,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { getDocs } from "./server";
import { Biqpod } from "@biqpod/app/ui/types";
import { delay, mergeArray, tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "./apis";
interface UserLineProps {
  user: Biqpod.Account.User;
}
export const UserLine = ({ user }: UserLineProps) => {
  const { uid, nickname, photo } = user;
  const isFollow = useCopyState<null | boolean>(null);
  useAsyncEffect(async () => {
    await delay(300);
    const result = uid ? await snapbuyApi.isFollowing(uid) : false;
    isFollow.set(!!result);
  }, []);
  return (
    <Card className="cursor-pointer">
      <div className="flex justify-between items-center gap-2 p-2">
        <div className="flex items-center gap-2">
          <Image
            className="border-none outline-none w-[50px] h-[50px]"
            src={photo ?? undefined}
            alt={<Icon iconClassName="text-5xl" icon={allIcons.solid.faBox} />}
          />
          <div>{nickname}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className={tw(
              "py-1 rounded-full",
              !isFollow.get &&
                "bg-[--biqpod-gray-opacity] text-[--biqpod-color]"
            )}
            onClick={async () => {
              if (!user) {
                showProfile();
                return;
              }
              if (!uid) {
                return;
              }
              if (isFollow.get === null) {
                return;
              }
              var state = isFollow.get;
              if (state) {
                isFollow.set(null);
                await snapbuyApi.unfollow(uid);
              } else {
                isFollow.set(null);
                await snapbuyApi.follow(uid);
              }
              await delay(300);
              isFollow.set(!state);
            }}
          >
            <div
              className={tw(
                "inline-flex items-center gap-0 transition-[gap] duration-200",
                typeof isFollow.get === "boolean" && "gap-2"
              )}
            >
              <Icon
                icon={
                  typeof isFollow.get === "boolean"
                    ? !isFollow.get
                      ? allIcons.solid.faPlus
                      : allIcons.solid.faMinus
                    : allIcons.solid.faCircleNotch
                }
                iconClassName={tw(isFollow.get === null && "animate-spin")}
              />
              <span
                className={tw(
                  "inline-block overflow-hidden h-[0px] w-[0px] transition-[width,height] duration-200",
                  typeof isFollow.get === "boolean" && "w-[55px] h-[20px]"
                )}
              >
                {isFollow.get ? (
                  <Translate content="unfollow" />
                ) : (
                  <Translate content="follow" />
                )}
              </span>
            </div>
          </Button>
          <Link to={"/client/stores/" + uid}>
            <CircleTip icon={allIcons.solid.faChevronRight} />
          </Link>
        </div>
      </div>
    </Card>
  );
};
const PAGE_SIZE = 10;
export const Users = () => {
  const users = useCopyState<Biqpod.Account.User[]>([]);
  const lastDoc = useCopyState<Biqpod.Account.User | null>(null);
  const hasMore = useCopyState(true);
  const hasMoreFollowes = useCopyState<boolean>(true);
  const followesLastDoc = useCopyState<SnapBuy.Follow | null>(null);
  var action = useAction(
    "fetch-users",
    async (next = false) => {
      if (hasMoreFollowes.get) {
        const followes = await snapbuyApi.getFollowed(
          PAGE_SIZE,
          followesLastDoc.get
        );
        if (!followes) {
          return;
        }
        const list = followes.map((follow) => follow.user!).filter(Boolean);
        if (list.length) {
          users.set((prev) => (next ? [...prev, ...list] : list));
          const lastDocRef = followes.at(-1)?.follow;
          followesLastDoc.set(lastDocRef || null);
          hasMoreFollowes.set(list.length === PAGE_SIZE);
          return;
        }
      }
      const newUsers = await getDocs<Biqpod.Account.User>(["users"], {
        orders: mergeArray(orderBy("uid", "asc")),
        limit: PAGE_SIZE,
        startAt: lastDoc.get?.uid && mergeArray(lastDoc.get?.uid),
      });
      if (!newUsers) {
        return;
      }
      const list = newUsers.map((user) => ({ ...user.data, id: user.id }));
      users.set((prev) => (next ? [...prev, ...list] : list));
      const lastDocRef = list.at(-1);
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(newUsers.length === PAGE_SIZE);
    },
    [lastDoc.get, hasMoreFollowes.get, followesLastDoc.get]
  );
  useEffect(() => {
    execAction("fetch-users");
  }, []);
  var loading = isLoading(action);
  return (
    <Scroll>
      <div className="flex flex-col gap-2 p-2">
        {users.get.map((user, index) => {
          return <UserLine user={user} key={index} />;
        })}
      </div>
      {hasMore.get && (
        <div className="flex justify-center items-center gap-2 p-2">
          <span>
            <Button
              onClick={() => {
                execAction("fetch-users", true);
              }}
              icon={
                loading
                  ? allIcons.solid.faCircleNotch
                  : allIcons.solid.faPaperPlane
              }
              className="rounded-full"
              iconClassName={tw(loading && "animate-spin")}
            >
              <span
                className={tw("transition-[font-family] duration-200")}
                style={{
                  font: loading ? "0px" : "8px",
                }}
              >
                <Translate content="fetch more" />
              </span>
            </Button>
          </span>
        </div>
      )}
    </Scroll>
  );
};
