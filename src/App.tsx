import {
  Container,
  Header,
  Layoutes,
  LeftSide,
  ProfileView,
  RightSide,
  Window,
} from "@biqpod/app/ui/layouts";
import { Redirect, Route, Switch, useLocation } from "react-router";
import { AuthRoute, PayoutRoute } from "@biqpod/app/ui/routes";
import { HeaderContent } from "./HeaderContent";
import unpaidPhoto from "./assets/unpaied.jpg";
// import integrationsPhoto from "./assets/integrations.png";
import {
  Line,
  Translate,
  Card,
  ClickedView,
  Button,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { Store } from "./routes/Stores/Store";
import { Client } from "./routes/Clients/Client";
import { FeedbackRoute } from "./routes/App/FeedbackRoute";
import { allIcons } from "@biqpod/app/ui/apis";
import { Plans } from "./routes/App/Plans";
import { PageNotFound } from "./routes/App/PageNotFound";
import { ProductRoute } from "./Links/ProductRoute";
import payChecked from "./assets/payment-checked.png";
import { setSettingValue } from "@biqpod/app/ui/hooks";
import { Stores } from "./routes/Stores/Stores";
import { OffersPage } from "./routes/App/OffersPage";
import { Deliveries } from "./Deliveries";
import { appTabs, extraTabs, tabServices } from "./utils";
import { isAndroid, isIos, isWeb } from "@biqpod/app/ui/app";
import { useEffect } from "react";
import { PackRoute } from "./Links/PackRoute";
import { ProfileInside } from "./ProfileInside";
import { range, tw } from "@biqpod/app/ui/utils";
import { Tracking } from "./Tracking";
import { CollectionsRoute } from "./routes/Collections/CollectionsRoute";
import { Profile } from "./routes/App/Profile";
import { Section } from "./routes/App/Section";
import { DeveloperRoute } from "./routes/Dev";
export const App = () => {
  const loc = useLocation();
  useEffect(() => {
    const searchParams = new URLSearchParams(loc.search);
    const lang = searchParams.get("lang");
    const dark = searchParams.get("dark");
    lang && setSettingValue("window/lang.enum", lang);
    typeof dark === "string" &&
      setSettingValue("window/dark.boolean", dark === "true");
  }, [loc.search]);
  const isClient = loc.pathname.match(/\/?client\/stores\/[0-9]+/gi);
  return (
    <div className="flex flex-col h-full">
      {isAndroid && (
        <div className="z-[100000000000000000000000000000000000000000000000] h-[24px]" />
      )}
      {isIos && (
        <div className="z-[100000000000000000000000000000000000000000000000] h-[40px]" />
      )}
      {!isClient && (
        <Header>
          <HeaderContent />
        </Header>
      )}
      <Window>
        {!isClient && <LeftSide />}
        <Container>
          <Switch>
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
                  <div className="flex justify-center items-center h-full">
                    <Card className="overflow-hidden">
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
                    </Card>
                  </div>
                }
              />
            </Route>
            <Route path="/payment" exact>
              <div className="flex flex-col justify-center items-center gap-2 w-full h-full">
                <Card className="overflow-hidden">
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
                    <Link to="/plans" className="w-full">
                      <Button icon={allIcons.solid.faArrowRightToBracket}>
                        <Translate content="upgrade plan" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </Route>
            <Route path="/plans" exact>
              <Plans />
            </Route>
            <Route path="/profile" exact>
              <div className="flex flex-col w-full h-full">
                <Section text="service for" />
                <div className="flex flex-wrap justify-center items-center gap-2 w-full">
                  {tabServices.map(({ link, name, photo }) => {
                    return (
                      <Card key={link} className={tw("overflow-hidden")}>
                        <ClickedView>
                          <Link to={link}>
                            <div className="flex justify-center p-5">
                              <img
                                src={photo}
                                className="w-[100px] object-cover"
                              />
                            </div>
                            <Line />
                            <div className="p-2 text-xl text-center capitalize">
                              <Translate content={name} />
                            </div>
                          </Link>
                        </ClickedView>
                      </Card>
                    );
                  })}
                </div>
                <Section text="more" />
                <div className="flex flex-wrap justify-center items-center gap-2 w-full">
                  {extraTabs.map((tab) => {
                    return (
                      <Card key={tab.link} className="overflow-hidden">
                        <ClickedView>
                          <Link to={tab.link}>
                            <div className="flex justify-center p-5">
                              <img
                                src={tab.photo}
                                className="w-[100px] object-cover"
                              />
                            </div>
                            <Line />
                            <div className="p-2 text-xl text-center capitalize">
                              <Translate content={tab.name} />
                            </div>
                          </Link>
                        </ClickedView>
                      </Card>
                    );
                  })}
                </div>
                {isWeb && (
                  <EmptyComponent>
                    <Section text="apps" />
                    <div className="flex flex-wrap justify-center items-center gap-2 w-full">
                      {appTabs.map((tab) => {
                        return (
                          <Card key={tab.url} className="overflow-hidden">
                            <ClickedView>
                              <a target="_blank" href={tab.url}>
                                <div className="flex justify-center p-5">
                                  <img
                                    src={tab.photo}
                                    className="w-[100px] object-cover"
                                  />
                                </div>
                                <Line />
                                <div className="p-2 text-xl text-center capitalize">
                                  <Translate content={tab.name} />
                                </div>
                              </a>
                            </ClickedView>
                          </Card>
                        );
                      })}
                    </div>
                  </EmptyComponent>
                )}
              </div>
            </Route>
            <Route path="/store">
              <Profile>
                <Switch>
                  <Route path="/store" exact>
                    <Stores />
                  </Route>
                  <Route path="/store/:storeId">
                    <Store />
                  </Route>
                </Switch>
              </Profile>
            </Route>
            <Route path="/product/:prodId">
              <ProductRoute />
            </Route>
            <Route exact path="/pack/:packId">
              <PackRoute />
            </Route>
            <Route path="/client">
              <Client />
            </Route>
            <Route path="/feedbacks" exact>
              <FeedbackRoute />
            </Route>
            <Route path="/developer" exact>
              <DeveloperRoute />
            </Route>
            <Route path="/offers">
              <OffersPage />
            </Route>
            <Route exact path="/">
              <Profile>
                <Redirect to="/profile" />
              </Profile>
            </Route>
            <Route exact path="/collection/:collectionId">
              <CollectionsRoute />
            </Route>
            <Route exact path="/auth/login">
              <Profile>
                <Redirect to="/profile" />
              </Profile>
              <ProfileView />
            </Route>
            <Route path="/deliveries">
              <Deliveries />
            </Route>
            <Route exact path="/tracking">
              <Tracking />
            </Route>
            <Route path="/test">
              <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                {range(9).map((i) => {
                  const colorClasses = [
                    "bg-[--biqpod-primary] text-white",
                    "bg-[--biqpod-secondary] text-white",
                  ];
                  return (
                    <div
                      key={i}
                      className={tw(
                        "flex justify-center active:scale-110 active:z-30 cursor-pointer transition-transform scale-100 duration-200 items-center w-full h-full font-extrabold text-5xl",
                        colorClasses[i % colorClasses.length]
                      )}
                    >
                      {9 - i + 1}
                    </div>
                  );
                })}
              </div>
            </Route>
            <Route path="*">
              <PageNotFound />
            </Route>
          </Switch>
        </Container>
        {!isClient && <RightSide />}
      </Window>
      {!isClient && <Layoutes profileContent={<ProfileInside />} />}
    </div>
  );
};
