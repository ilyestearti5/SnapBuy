import React from "react";
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
import { LinkAccount } from "./LinkAccount";
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
const TestGrid = React.memo(() => {
  const testItems = React.useMemo(
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
  return <>{testItems}</>;
});
export const App = () => {
  useUrlSettings();
  const serviceCards = React.useMemo(
    () =>
      tabServices.map(({ link, name, photo }, index) => (
        <AnimatedListItem key={link} index={index}>
          <ServiceCard link={link} name={name} photo={photo} index={index} />
        </AnimatedListItem>
      )),
    []
  );
  const extraCards = React.useMemo(
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
  const appCards = React.useMemo(
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
            <Route path="/link">
              <LinkAccount />
            </Route>
            <Route exact path="/">
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
                <AnimatedPage>
                  <Store />
                </AnimatedPage>
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
            <Route path="/feedbacks" exact>
              <AnimatedPage>
                <FeedbackRoute />
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
            <Route path="*">
              <AnimatedPage>
                <PageNotFound />
              </AnimatedPage>
            </Route>
          </Switch>
        </Container>
        <RightSide />
      </Window>
      <Layoutes profileContent={<ProfileInside />} />
    </div>
  );
};
