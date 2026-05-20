import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import {
  Container,
  Header,
  Layoutes,
  LeftSide,
  RightSide,
  Window,
} from "@biqpod/app/ui/layouts";
import { Switch, Link, Redirect, Route, useLocation } from "react-router-dom";
import { HeaderContent } from "./HeaderContent";
import { isAndroid, isIos } from "@biqpod/app/ui/app";
import { ProfileInside } from "./ProfileInside";
import { useUrlSettings } from "./hooks/useUrlSettings";
const Profile = lazy(() =>
  import("./routes/App/Profile").then((module) => ({ default: module.Profile }))
);
import { ProfileView } from "@biqpod/app/ui/layouts";
import { AuthRoute, PayoutRoute } from "@biqpod/app/ui/routes";
import {
  AnimatedPage,
  AnimatedCard,
  AnimatedList,
  AnimatedListItem,
} from "./animations/components";
import { Line, Translate, Button, Card, Tip } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import unpaidPhoto from "./assets/unpaied.jpg";
import payChecked from "./assets/payment-checked.png";
const AgentAi = lazy(() =>
  import("./Agent").then((module) => ({ default: module.AgentAi }))
);
const Section = lazy(() =>
  import("./routes/App/Section").then((module) => ({ default: module.Section }))
);
import { ServiceCard } from "./components/ServiceCard";
import { EmptyComponent } from "@biqpod/app/ui/components";
import { appTabs, extraTabs, tabServices } from "./utils";
import { isWeb } from "@biqpod/app/ui/app";
const FeedbackRoute = lazy(() =>
  import("./routes/App/FeedbackRoute").then((module) => ({
    default: module.FeedbackRoute,
  }))
);
const PageNotFound = lazy(() =>
  import("./routes/App/PageNotFound").then((module) => ({
    default: module.PageNotFound,
  }))
);
const DocumentationRoute = lazy(() =>
  import("./routes/App/DocumentationRoute").then((module) => ({
    default: module.DocumentationRoute,
  }))
);
const DeveloperRoute = lazy(() =>
  import("./routes/Dev").then((module) => ({ default: module.DeveloperRoute }))
);
const CollectionsRoute = lazy(() =>
  import("./routes/Collections/CollectionsRoute").then((module) => ({
    default: module.CollectionsRoute,
  }))
);
const Deliveries = lazy(() =>
  import("./Deliveries").then((module) => ({ default: module.Deliveries }))
);
const Tracking = lazy(() =>
  import("./Tracking").then((module) => ({ default: module.Tracking }))
);
const Client = lazy(() =>
  import("./routes/Clients/Client").then((module) => ({
    default: module.Client,
  }))
);
const PackRoute = lazy(() =>
  import("./Links/PackRoute").then((module) => ({ default: module.PackRoute }))
);
const ProductRoute = lazy(() =>
  import("./Links/ProductRoute").then((module) => ({
    default: module.ProductRoute,
  }))
);
const Stores = lazy(() =>
  import("./routes/Stores/Stores").then((module) => ({
    default: module.Stores,
  }))
);
const Homepage = lazy(() =>
  import("./routes/Homepage").then((module) => ({ default: module.Homepage }))
);
import { AccountLinking } from "./AccountLinking";
import { useProfileContent } from "@biqpod/app/ui/hooks";
const TestGrid = lazy(() =>
  import("./Test").then((module) => ({ default: module.TestGrid }))
);
import { News } from "./News";
import { CheckBeforeShow } from "./CheckBeforeShow";
import { Preview } from "./Preview";
export const App = () => {
  useUrlSettings();
  useProfileContent(<ProfileInside />);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [width, setWidth] = useState("0%");

  useEffect(() => {
    setIsLoading(true);
    setWidth("0%");
    setTimeout(() => setWidth("100%"), 10);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);
  const serviceCards = useMemo(
    () =>
      tabServices.map(({ link, name, photo }, index) => (
        <AnimatedListItem key={link} index={index}>
          <ServiceCard link={link} name={name} photo={photo} index={index} />
        </AnimatedListItem>
      )),
    []
  );
  const extraCards = useMemo(
    () =>
      extraTabs.map((tab, index) => (
        <AnimatedListItem key={tab.link} index={index}>
          <ServiceCard
            link={tab.link}
            name={tab.name}
            photo={tab.photo}
            index={index}
          />
        </AnimatedListItem>
      )),
    []
  );
  const appCards = useMemo(
    () =>
      isWeb
        ? appTabs.map((tab, index) => (
            <AnimatedListItem key={tab.url} index={index}>
              <ServiceCard
                link={tab.url}
                name={tab.name}
                photo={tab.photo}
                index={index}
                isExternal={true}
              />
            </AnimatedListItem>
          ))
        : [],
    []
  );

  const isProductRoute = location.pathname.startsWith("/product/");
  return (
    <div className="flex flex-col h-full">
      {isAndroid && (
        <div className="z-[100000000000000000000000000000000000000000000000] h-[24px]" />
      )}
      {isIos && (
        <div className="z-[100000000000000000000000000000000000000000000000] h-[40px]" />
      )}
      {!isProductRoute && (
        <Header>
          <HeaderContent />
        </Header>
      )}
      {isLoading && (
        <div
          className="top-0 left-0 z-50 fixed bg-blue-200 shadow-sm h-1 transition-all duration-500 ease-out"
          style={{ width }}
        ></div>
      )}{" "}
      {isLoading && (
        <div
          className="z-40 fixed inset-0 bg-transparent"
          onClick={() => {}}
        ></div>
      )}{" "}
      <Window>
        <LeftSide />
        <Container>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-full">
                <div>Loading...</div>
              </div>
            }
          >
            <Switch>
              <Route path="/preview">
                <Preview />
              </Route>
              <Route path="/news/:newsId">
                <News />
              </Route>
              <Route path="/link">
                <div className="flex justify-center items-center h-full">
                  <AccountLinking />
                </div>
              </Route>
              <Route path="/__/payout">
                <PayoutRoute
                  successComponent={({ payout }) => {
                    const template = payout.meta?.template;
                    const isPayTemplate = !!template;
                    const storeId = payout.meta?.storeId;
                    return (
                      <AnimatedPage className="flex justify-center items-center h-full">
                        <Card>
                          {isPayTemplate ? (
                            <EmptyComponent>
                              <div className="flex justify-center p-6">
                                <img
                                  src={payChecked}
                                  className="w-[150px] h-[150px] object-contain"
                                  draggable={false}
                                />
                              </div>
                              <Line />
                              <div className="p-4 text-center">
                                <h2 className="mb-2 font-bold text-[--biqpod-success] text-2xl">
                                  <Translate content="Template Purchased!" />
                                </h2>
                                <p className="text-[--biqpod-gray-opacity-2] mb-4">
                                  <Translate content="Your template payment has been processed successfully" />
                                </p>
                                <div className="bg-[--biqpod-secondary-background] mb-4 p-4 rounded-lg">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-[--biqpod-gray-opacity-2]">
                                        <Translate content="Amount:" />
                                      </span>
                                      <span className="font-semibold">
                                        {payout?.amount?.toFixed(2)} DA
                                      </span>
                                    </div>
                                    {payout?.payoutId && (
                                      <div className="flex justify-between">
                                        <span className="text-[--biqpod-gray-opacity-2]">
                                          <Translate content="Payment ID:" />
                                        </span>
                                        <div className="inline-flex items-center gap-2">
                                          <span className="font-mono text-sm">
                                            {payout.payoutId.slice(0, 4)}...
                                            {payout.payoutId.slice(-4)}
                                          </span>
                                          <Tip
                                            icon={allIcons.regular.faCopy}
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                payout.payoutId || ""
                                              );
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {payout?.createdAt && (
                                      <div className="flex justify-between">
                                        <span className="text-[--biqpod-gray-opacity-2]">
                                          <Translate content="Date:" />
                                        </span>
                                        <span className="text-sm">
                                          {new Date(
                                            payout.createdAt
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Line />
                              <div className="p-4">
                                {storeId && (
                                  <Link
                                    className="mb-2 w-full"
                                    to={`/store/${storeId}/dashboard`}
                                  >
                                    <Button className="bg-[--biqpod-primary] w-full text-[--biqpod-primary-content]">
                                      <Translate content="Go to Store Dashboard" />
                                    </Button>
                                  </Link>
                                )}
                                <Link className="w-full" to="/profile">
                                  <Button className="bg-[--biqpod-success] w-full text-[--biqpod-primary-content]">
                                    <Translate content="Continue to Dashboard" />
                                  </Button>
                                </Link>
                              </div>
                            </EmptyComponent>
                          ) : payout?.status === "paid" ? (
                            <EmptyComponent>
                              <div className="flex justify-center p-6">
                                <img
                                  src={payChecked}
                                  className="w-[150px] h-[150px] object-contain"
                                  draggable={false}
                                />
                              </div>
                              <Line />
                              <div className="p-4 text-center">
                                <h2 className="mb-2 font-bold text-[--biqpod-success] text-2xl">
                                  <Translate content="Congratulations!" />
                                </h2>
                                <p className="text-[--biqpod-gray-opacity-2] mb-4">
                                  <Translate content="Your payment has been processed successfully" />
                                </p>
                                <div className="bg-[--biqpod-secondary-background] mb-4 p-4 rounded-lg">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-[--biqpod-gray-opacity-2]">
                                        <Translate content="Amount:" />
                                      </span>
                                      <span className="font-semibold">
                                        {payout?.amount?.toFixed(2)} DA
                                      </span>
                                    </div>
                                    {payout?.payoutId && (
                                      <div className="flex justify-between">
                                        <span className="text-[--biqpod-gray-opacity-2]">
                                          <Translate content="Payment ID:" />
                                        </span>
                                        <div className="inline-flex items-center gap-2">
                                          <span className="font-mono text-sm">
                                            {payout.payoutId.slice(0, 4)}...
                                            {payout.payoutId.slice(-4)}
                                          </span>
                                          <Tip
                                            icon={allIcons.regular.faCopy}
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                payout.payoutId || ""
                                              );
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {payout?.createdAt && (
                                      <div className="flex justify-between">
                                        <span className="text-[--biqpod-gray-opacity-2]">
                                          <Translate content="Date:" />
                                        </span>
                                        <span className="text-sm">
                                          {new Date(
                                            payout.createdAt
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Line />
                              <div className="p-4">
                                <Link className="w-full" to="/profile">
                                  <Button className="bg-[--biqpod-success] w-full text-[--biqpod-primary-content]">
                                    <Translate content="Continue to Dashboard" />
                                  </Button>
                                </Link>
                              </div>
                            </EmptyComponent>
                          ) : (
                            <EmptyComponent>
                              <div className="flex justify-center p-6">
                                <div className="flex justify-center p-6">
                                  <img
                                    src={unpaidPhoto}
                                    className="w-[150px] h-[150px] object-contain"
                                    draggable={false}
                                  />
                                </div>
                              </div>
                              <Line />
                              <div className="p-4 text-center">
                                <h2 className="mb-2 font-semibold text-[--biqpod-warning] text-xl">
                                  <Translate content="Payment Processing" />
                                </h2>
                                <p className="text-[--biqpod-gray-opacity-2] mb-4">
                                  <Translate content="Your payment is being processed. Please wait..." />
                                </p>
                                {payout?.status && (
                                  <div className="bg-[--biqpod-secondary-background] mb-4 p-3 rounded-lg">
                                    <p className="text-[--biqpod-warning] text-sm">
                                      <Translate content="Status:" />{" "}
                                      <span className="font-medium capitalize">
                                        {payout.status}
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </div>
                              <Line />
                              <div className="p-4">
                                <Button
                                  className="bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-hover] w-full text-[--biqpod-text-color]"
                                  onClick={() => window.location.reload()}
                                >
                                  <Translate content="Check Status" />
                                </Button>
                              </div>
                            </EmptyComponent>
                          )}
                        </Card>
                      </AnimatedPage>
                    );
                  }}
                />
              </Route>
              <Route path="/agent">
                <Profile>
                  <AgentAi />
                </Profile>
              </Route>
              <Route path="/profile" exact>
                <AnimatedPage className="flex flex-col w-full h-full">
                  <Section text="service for" />
                  <AnimatedList className="flex flex-wrap justify-center items-center gap-2 w-full">
                    {serviceCards}
                  </AnimatedList>
                  <Section text="more" />
                  <AnimatedList className="flex flex-wrap justify-center items-center gap-2 w-full">
                    {extraCards}
                  </AnimatedList>
                  {isWeb && (
                    <EmptyComponent>
                      <Section text="apps" />
                      <AnimatedList className="flex flex-wrap justify-center items-center gap-2 w-full">
                        {appCards}
                      </AnimatedList>
                    </EmptyComponent>
                  )}
                </AnimatedPage>
              </Route>
              <Route exact path="/home">
                <Homepage />
              </Route>
              <Route path="/dashboard">
                <Profile>
                  <Redirect to="/profile" />
                </Profile>
              </Route>
              <Route exact path="/auth/login">
                <Profile>
                  <Redirect to="/profile" />
                </Profile>
                <ProfileView />
              </Route>
              <Route path="/__/auth">
                <AuthRoute
                  successComponent={
                    <Profile>
                      <Redirect to="/profile" />
                    </Profile>
                  }
                />
              </Route>
              <Route path="/__/payment" exact>
                <PayoutRoute
                  successComponent={
                    <AnimatedPage className="flex justify-center items-center h-full">
                      <AnimatedCard className="overflow-hidden">
                        <div className="flex w-[50vw] max-w-[400px]">
                          <img
                            src={payChecked}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                        <Line />
                        <div className="p-3 text-2xl text-center capitalize">
                          <Translate content="yor all good to go" />
                        </div>
                        <Line />
                        <div className="p-2">
                          <Link className="w-full" to="/producer/orders">
                            <Button className="rounded-full">
                              <Translate content="go to dashboard" />
                            </Button>
                          </Link>
                        </div>
                      </AnimatedCard>
                    </AnimatedPage>
                  }
                />
              </Route>
              <Route path="/payment" exact>
                <AnimatedPage className="flex flex-col justify-center items-center gap-2 w-full h-full">
                  <AnimatedCard className="overflow-hidden">
                    <div className="flex w-[60vw]">
                      <img
                        src={unpaidPhoto}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Line />
                    <div className="p-2 text-2xl text-center capitalize">
                      <Translate content="you not subscribed to any plan" />
                    </div>
                    <Line />
                    <div className="flex gap-2 p-2">
                      <Button
                        className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
                        onClick={() => {
                          window.location.reload();
                        }}
                        icon={allIcons.solid.faCheckCircle}
                      >
                        <Translate content="check again" />
                      </Button>
                      <Link to="/store" className="w-full">
                        <Button icon={allIcons.solid.faArrowRightToBracket}>
                          <Translate content="select store" />
                        </Button>
                      </Link>
                    </div>
                  </AnimatedCard>
                </AnimatedPage>
              </Route>
              <Route path="/store" exact>
                <Profile>
                  <AnimatedPage>
                    <Stores />
                  </AnimatedPage>
                </Profile>
              </Route>
              <Route path="/store/:storeId">
                <Profile>
                  <CheckBeforeShow />
                </Profile>
              </Route>
              <Route path="/product/:prodId">
                <AnimatedPage>
                  <ProductRoute />
                </AnimatedPage>
              </Route>
              <Route exact path="/pack/:packId">
                <AnimatedPage>
                  <PackRoute />
                </AnimatedPage>
              </Route>
              <Route path="/client">
                <AnimatedPage>
                  <Client />
                </AnimatedPage>
              </Route>
              <Route path="/feedback" exact>
                <AnimatedPage>
                  <FeedbackRoute />
                </AnimatedPage>
              </Route>
              <Route path="/documentation" exact>
                <AnimatedPage>
                  <DocumentationRoute />
                </AnimatedPage>
              </Route>
              <Route path="/developer" exact>
                <AnimatedPage>
                  <DeveloperRoute />
                </AnimatedPage>
              </Route>
              <Route exact path="/collection/:collectionId">
                <AnimatedPage>
                  <CollectionsRoute />
                </AnimatedPage>
              </Route>
              <Route path="/deliveries">
                <AnimatedPage>
                  <Deliveries />
                </AnimatedPage>
              </Route>
              <Route exact path="/tracking">
                <AnimatedPage>
                  <Tracking />
                </AnimatedPage>
              </Route>
              <Route path="/test">
                <AnimatedPage>
                  <TestGrid />
                </AnimatedPage>
              </Route>
              <Route path="/" exact>
                <Redirect to="/home" />
              </Route>
              <Route path="*">
                <AnimatedPage>
                  <PageNotFound />
                </AnimatedPage>
              </Route>
            </Switch>
          </Suspense>
        </Container>
        <RightSide />
      </Window>
      <Layoutes />
    </div>
  );
};
