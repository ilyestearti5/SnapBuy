import { allIcons } from "@biqpod/app/ui/apis";
import {
  AsyncComponent,
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  CircleTip,
  EmptyComponent,
  Icon,
  Image,
  Key,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  execAction,
  getTemp,
  isLoading,
  showPopup,
  showProfile,
  useAction,
  useAsyncEffect,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Biqpod } from "@biqpod/app/ui/types";
import { delay, tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "../../apis";
import { motion, AnimatePresence } from "framer-motion";
import { CartPopup } from "./CartPopup";
import { deleteCart } from "../../apis/snapbuy";
// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};
const userCardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};
const storeCardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};
const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.95,
  },
};
const cartItemVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
  hover: {
    scale: 1.01,
    x: 5,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    scale: 0.8,
    transition: {
      duration: 0.3,
    },
  },
};
const emptyStateVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 20,
      delay: 0.5,
    },
  },
};
const loadMoreButtonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
};
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
    <motion.div
      variants={userCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card className="cursor-pointer">
        <div className="flex justify-between items-center gap-2 p-2">
          <div className="flex items-center gap-2">
            <Image
              className="border-none outline-none w-[50px] h-[50px]"
              src={photo ?? undefined}
              alt={
                <Icon iconClassName="text-5xl" icon={allIcons.solid.faBox} />
              }
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
    </motion.div>
  );
};
interface StoreRecordProps {
  store: SnapBuy.Store;
}
export const StoreRecord = ({ store }: StoreRecordProps) => {
  const { name, photo } = store;
  return (
    <motion.div
      variants={storeCardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card
        className="active:bg-[--biqpod-gray-opacity] shadow-md hover:shadow-lg cursor-pointer"
        style={{ minHeight: 70 }}
      >
        <Link
          to={"/client/stores/" + store.id}
          className="flex justify-between items-center gap-4 p-3"
        >
          <div className="flex items-center gap-4">
            <Image
              className="border-none rounded-xl outline-none w-[48px] h-[48px] object-cover"
              src={photo ?? undefined}
              alt={
                <Icon iconClassName="text-5xl" icon={allIcons.solid.faStore} />
              }
            />
            <div className="flex flex-col justify-center">
              <span className="mb-1 font-semibold text-base">{name}</span>
              {/* <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  icon={allIcons.solid.faStar}
                  iconClassName="text-yellow-400 text-lg mr-0.5 drop-shadow"
                />
              ))}
            </div> */}
            </div>
          </div>
          <div>
            <CircleTip icon={allIcons.solid.faChevronRight} />
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};
const PAGE_SIZE = 10;
export const Carts = () => {
  const carts = getTemp<any>("cart");
  const cartsInList = Object.entries(carts || {}).filter(
    ([_, products]) => Object.keys(products || {}).length
  );
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh]">
      <CardHeaderForPopup title="carts" className="font-bold uppercase" />
      <Line />
      <Scroll>
        <motion.div
          className="flex flex-col gap-2 p-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {cartsInList.map(([storeId, products]) => {
              const cartInArray = Object.entries(products || {});
              const length = cartInArray.length;
              return (
                <motion.div key={storeId} variants={cartItemVariants} layout>
                  <Card className="active:bg-[--biqpod-gray-opacity-2] cursor-pointer">
                    <div className="flex justify-between items-center gap-2 px-5 py-2">
                      <div className="flex items-center gap-2">
                        <AsyncComponent
                          render={async () => {
                            const store = await snapbuyApi.getStore(storeId);
                            return (
                              <EmptyComponent>
                                <Image
                                  className="w-[50px] h-[50px]"
                                  src={store?.photo ?? undefined}
                                />
                                <h1 className="text-xl">{store?.name}</h1>
                              </EmptyComponent>
                            );
                          }}
                          loading={
                            <CardWait className="rounded-lg w-[150px] h-[30px]" />
                          }
                        />
                      </div>
                      <div className="flex items-center">
                        <Key>{length}</Key>
                        <div className="ml-1">
                          <CircleTip
                            className="rounded-full"
                            onClick={async () => {
                              const isYes = await confirm({
                                title: "Delete Cart",
                                message:
                                  "Are you sure you want to delete this cart?",
                              });
                              if (isYes) {
                                deleteCart(storeId);
                              }
                            }}
                            icon={allIcons.solid.faTrashCan}
                          />
                        </div>
                        <div>
                          <CircleTip
                            icon={allIcons.solid.faChevronRight}
                            onClick={() => {
                              showPopup(
                                <CartPopup storeId={storeId} backToCarts />
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!cartsInList.length && (
            <motion.div
              variants={emptyStateVariants}
              initial="hidden"
              animate="visible"
              className="flex justify-center items-center p-4"
            >
              <div className="flex flex-col items-center gap-2 text-[--biqpod-gray-opacity-2]">
                <Icon
                  icon={allIcons.solid.faCartPlus}
                  iconClassName="text-5xl"
                />
                <p className="text-lg text-center">
                  <Translate content="no carts found" />
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Scroll>
    </Card>
  );
};
export const ExploreStores = () => {
  const stores = useCopyState<SnapBuy.Store[]>([]);
  const lastDoc = useCopyState<SnapBuy.Store | null>(null);
  const hasMore = useCopyState(true);
  const action = useAction(
    "fetch-explore-stores",
    async (next = false) => {
      const list = await snapbuyApi.getExploreStores({
        limit: PAGE_SIZE,
        startAt: lastDoc.get?.uid,
        orderBy: "uid",
        orderDir: "asc",
      });
      if (!list) {
        return;
      }
      stores.set((prev) => (next ? [...prev, ...list] : list));
      const lastDocRef = list.at(-1);
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(list.length === PAGE_SIZE);
    },
    [lastDoc.get]
  );
  useEffect(() => {
    execAction("fetch-explore-stores");
  }, []);
  const loading = isLoading(action);
  const allCarts = getTemp<any>("cart");
  const hasCarts = useMemo(() => {
    if (!allCarts) return false;
    return Object.values(allCarts).filter((v) => v).length > 0;
  }, [allCarts]);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Scroll>
        <motion.div
          className="flex flex-col gap-2 p-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stores.get.map((store, index) => {
            return <StoreRecord store={store} key={index} />;
          })}
        </motion.div>
        {hasMore.get && (
          <motion.div
            className="flex justify-center items-center gap-2 p-2"
            variants={loadMoreButtonVariants}
            initial="hidden"
            animate="visible"
          >
            <span>
              <motion.button
                onClick={() => {
                  execAction("fetch-explore-stores", true);
                }}
                className={tw(
                  "rounded-full flex items-center justify-center overflow-hidden",
                  loading && "animate-spin"
                )}
                style={{
                  background: "var(--biqpod-primary)",
                  color: "var(--biqpod-primary-content)",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  padding: "8px 0px",
                  minHeight: "40px",
                  minWidth: "40px",
                }}
                animate={{
                  width: loading ? 40 : 120,
                  transition: { type: "spring", stiffness: 300, damping: 30 },
                }}
              >
                <Icon
                  icon={
                    loading
                      ? allIcons.solid.faCircleNotch
                      : allIcons.solid.faPaperPlane
                  }
                  iconClassName={tw(loading && "animate-spin")}
                />
                <motion.span
                  className={tw(
                    "transition-[font-family] duration-200 ml-2 whitespace-nowrap"
                  )}
                  style={{ font: loading ? "0px" : "8px" }}
                  animate={{
                    opacity: loading ? 0 : 1,
                    width: loading ? 0 : "auto",
                    marginLeft: loading ? 0 : 8,
                    transition: { duration: 0.3 },
                  }}
                >
                  <Translate content="fetch more" />
                </motion.span>
              </motion.button>
            </span>
          </motion.div>
        )}
      </Scroll>
      {hasCarts && (
        <EmptyComponent>
          <Line />
          <motion.div
            className="p-2"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              onClick={() => {
                showPopup(<Carts />);
              }}
              className="rounded-full"
            >
              <Translate content="see all carts" />
            </Button>
          </motion.div>
        </EmptyComponent>
      )}
    </div>
  );
};
