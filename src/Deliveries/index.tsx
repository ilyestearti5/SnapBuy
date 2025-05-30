import { Card, Line, Translate } from "@biqpod/app/ui/components";
import photo from "../assets/page-not-found.png";

// const deliveriesTabs = [
//   {
//     name: "overview",
//     photo: overviewPhotos,
//   },
//   {
//     name: "accounts",
//     photo: accountsPhotos,
//   },
// ];

export const Deliveries = () => {
  // const loc = useLocation();
  // const colorMerge = useColorMerge();
  return (
    <div className="flex gap-1 h-full">
      {/* <div className="flex items-center h-full">
        <div className="inline-flex flex-col gap-2 bg-[--biqpod-primary-background] p-2 border-[--biqpod-borders] border-y border-r border-solid rounded-se-3xl rounded-ee-3xl">
          {deliveriesTabs.map((item, index) => {
            const isSelected = loc.pathname === `/deliveries/${item.name}`;
            return (
              <Link to={`/deliveries/${item.name}`} key={index}>
                <Button
                  className="rounded-full w-[50px] h-[50px]"
                  iconClassName="text-xl"
                  style={{
                    ...colorMerge(
                      !isSelected && "gray.opacity",
                      !isSelected && {
                        color: "text.color",
                      }
                    ),
                  }}
                >
                  <img src={item.photo} className="w-full" />
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="bg-[--biqpod-primary-background] border-[--biqpod-borders] border-y border-l border-solid rounded-ss-3xl rounded-es-3xl w-full overflow-hidden">
        <Scroll>
          <Switch>
            <Route path="/deliveries/overview">Overview</Route>
            <Route path="/deliveries/accounts">
              <Accounts />
            </Route>
            <Route path="/deliveries" exact>
              <Redirect to="/deliveries/overview" />
            </Route>
          </Switch>
        </Scroll>
      </div> */}
      <div className="flex justify-center items-center w-full h-full">
        <Card className="max-md:w-[80vw]">
          <div className="flex justify-center items-center">
            <img src={photo} draggable={false} className="w-full" alt="" />
          </div>
          <Line />
          <div className="p-5">
            <h1 className="font-bold text-2xl text-center capitalize">
              <Translate content="this page will be available soon" />
            </h1>
          </div>
        </Card>
      </div>
    </div>
  );
};
