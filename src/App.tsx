import { memo, useMemo } from "react";
import {
  Container,
  Header,
  Layoutes,
  LeftSide,
  RightSide,
  Window,
} from "@biqpod/app/ui/layouts";
import { Switch, Link, Redirect, Route } from "react-router-dom";
import { HeaderContent } from "./HeaderContent";
import { isAndroid, isIos } from "@biqpod/app/ui/app";
import { ProfileInside } from "./ProfileInside";
import { useUrlSettings } from "./hooks/useUrlSettings";
import { Profile } from "./routes/App/Profile";
import { ProfileView } from "@biqpod/app/ui/layouts";
import { AuthRoute, PayoutRoute } from "@biqpod/app/ui/routes";
import {
  AnimatedPage,
  AnimatedCard,
  AnimatedList,
  AnimatedListItem,
} from "./animations/components";
import { Line, Translate, Button } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import unpaidPhoto from "./assets/unpaied.jpg";
import payChecked from "./assets/payment-checked.png";
import { AgentAi } from "./Agent";
import { Section } from "./routes/App/Section";
import { ServiceCard } from "./components/ServiceCard";
import { EmptyComponent } from "@biqpod/app/ui/components";
import { appTabs, extraTabs, tabServices } from "./utils";
import { isWeb } from "@biqpod/app/ui/app";
import { FeedbackRoute } from "./routes/App/FeedbackRoute";
import { PageNotFound } from "./routes/App/PageNotFound";
import { OffersPage } from "./routes/App/OffersPage";
import { DocumentationRoute } from "./routes/App/DocumentationRoute";
import { DeveloperRoute } from "./routes/Dev";
import { CollectionsRoute } from "./routes/Collections/CollectionsRoute";
import { Deliveries } from "./Deliveries";
import { Tracking } from "./Tracking";
import { Client } from "./routes/Clients/Client";
import { PackRoute } from "./Links/PackRoute";
import { ProductRoute } from "./Links/ProductRoute";
import { range, tw } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
import { Stores } from "./routes/Stores/Stores";
import { Store } from "./routes/Stores/Store";
import { Homepage } from "./routes/Homepage";
import { AccountLinking } from "./AccountLinking";
import { useProfileContent } from "@biqpod/app/ui/hooks";
const CheckBeforeShow = () => {
  return (
    <div className="h-full overflow-hidden">
      <AnimatedPage>
        <Store />
      </AnimatedPage>
    </div>
  );
};
const TestGrid = memo(() => {
  const testItems = useMemo(
    () =>
      range(9).map((i) => {
        const colorClasses = [
          "bg-[--biqpod-primary] text-white",
          "bg-[--biqpod-secondary] text-white",
        ];
        return (
          <motion.div
            key={i}
            className={tw(
              "flex justify-center active:scale-110 active:z-30 cursor-pointer transition-transform scale-100 duration-200 items-center w-full h-full font-extrabold text-5xl",
              colorClasses[i % colorClasses.length]
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.1, zIndex: 30 }}
            whileTap={{ scale: 0.9 }}
          >
            {9 - i + 1}
          </motion.div>
        );
      }),
    []
  );
  return <EmptyComponent>{testItems}</EmptyComponent>;
});
export const App = () => {
  useUrlSettings();
  useProfileContent(<ProfileInside />);
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
  return (
    <div className="flex flex-col h-full">
      {isAndroid && (
        <div className="z-[100000000000000000000000000000000000000000000000] h-[24px]" />
      )}
      {isIos && (
        <div className="z-[100000000000000000000000000000000000000000000000] h-[40px]" />
      )}
      <Header>
        <HeaderContent />
      </Header>
      <Window>
        <LeftSide />
        <Container>
          <Switch>
            <Route path="/link">
              <div className="flex justify-center items-center h-full">
                <AccountLinking />
              </div>
            </Route>
            <Route path="/payout?">
              <PayoutRoute
                successComponent={({ payout }) => (
                  <AnimatedPage className="flex justify-center items-center h-full">
                    <AnimatedCard className="max-w-md overflow-hidden">
                      {payout?.status === "paid" ? (
                        <EmptyComponent>
                          <div className="flex justify-center p-6">
                            <div className="flex justify-center items-center bg-[--biqpod-success] rounded-full w-24 h-24">
                              <img
                                src={payChecked}
                                className="w-16 h-16 object-contain"
                                draggable={false}
                              />
                            </div>
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
                                    <span className="font-mono text-sm">
                                      {payout.payoutId}
                                    </span>
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
                              <Button className="bg-[--biqpod-success] hover:bg-[--biqpod-success-hover] w-full text-[--biqpod-primary-content]">
                                <Translate content="Continue to Dashboard" />
                              </Button>
                            </Link>
                          </div>
                        </EmptyComponent>
                      ) : (
                        <EmptyComponent>
                          <div className="flex justify-center p-6">
                            <div className="flex justify-center items-center bg-[--biqpod-warning] rounded-full w-24 h-24">
                              <img
                                src={unpaidPhoto}
                                className="opacity-75 w-16 h-16 object-contain"
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
                    </AnimatedCard>
                  </AnimatedPage>
                )}
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
                        location.reload();
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
            <Route path="/offers">
              <AnimatedPage>
                <OffersPage />
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
              <AnimatedPage className="grid grid-cols-3 grid-rows-3 w-full h-full">
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
        </Container>
        <RightSide />
      </Window>
      <Layoutes />
    </div>
  );
};
