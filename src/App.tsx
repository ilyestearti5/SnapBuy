import {
  Container,
  Header,
  Layoutes,
  LeftSide,
  ProfileView,
  RightSide,
  Window,
} from "@biqpod/app/ui/layouts";
import { Redirect, Route, Switch } from "react-router";
import { AuthRoute, PayoutRoute } from "@biqpod/app/ui/routes";
import { HeaderContent } from "./HeaderContent";
import productsPhoto from "./assets/products.png";
import storePhoto from "./assets/store.png";
import clientPhoto from "./assets/clients.png";
import shoppingPhoto from "./assets/shopping.png";
import feedbackPhoto from "./assets/feedback.png";
import offersPhoto from "./assets/offers.png";
import overviewPhoto from "./assets/overview.png";
import unpaidPhoto from "./assets/unpaied.jpg";
// import integrationsPhoto from "./assets/integrations.png";
import deliveryPhoto from "./assets/delivery.png";
import {
  Line,
  Translate,
  Card,
  ClickedView,
  Button,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { Store } from "./Store";
import { Client } from "./Client";
import { FeedbackRoute } from "./FeedbackRoute";
import { Redirections } from "./RedirectToLoginIfNeeded";
import { allIcons } from "@biqpod/app/ui/apis";
import { Plans } from "./Plans";
import { PageNotFound } from "./PageNotFound";
import { ProductRoute } from "./Links/ProductRoute";
import payChecked from "./assets/payment-checked.png";
import { getTemp, getTempFromStore, useUser } from "@biqpod/app/ui/hooks";
import { Stores } from "./Stores";
import { OffersPage } from "./OffersPage";
import { Deliveries } from "./Deliveries";
export const userTabs = [
  {
    name: "overview",
    link: `/store/{storeId}/overview`,
    photo: overviewPhoto,
  },
  {
    name: "products",
    link: `/store/{storeId}/products`,
    photo: productsPhoto,
  },
  {
    name: "orders",
    link: `/store/{storeId}/orders`,
    photo: shoppingPhoto,
  },
  // {
  //   name: "integrations",
  //   link: `/store/{storeId}/integrations`,
  //   photo: integrationsPhoto,
  // },
  {
    name: "Stores",
    link: `/store/{storeId}/stores`,
    photo: storePhoto,
  },
];
interface ProfileProps {
  children?: JSX.Element;
}
export const Profile = ({ children }: ProfileProps) => {
  const userLoaded = getTemp<boolean>("userLoaded");
  const user = useUser();
  return (
    <EmptyComponent>
      {userLoaded && user && children}
      <Redirections />
    </EmptyComponent>
  );
};
export const useStoreId = () => {
  return getTemp<string>("storeId");
};
export const getStoreId = () => {
  return getTempFromStore<string>("storeId");
};

export const App = () => {
  return (
    <div className="flex flex-col h-full">
      <Header>
        <HeaderContent />
      </Header>
      <Window>
        <LeftSide />
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
                  <div className="flex flex justify-center items-center h-full">
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
                <div className="flex justify-center items-center p-4">
                  <h1 className="bg-clip-text bg-gradient-to-r from-[--biqpod-primary] to-[--biqpod-secondary] font-bold text-transparent text-3xl text-center capitalize">
                    <Translate content="who are you" />
                  </h1>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-2 w-full">
                  {tabServices.map((tab) => {
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
                <div className="flex justify-center items-center p-4">
                  <h1 className="bg-clip-text bg-gradient-to-r from-[--biqpod-primary] to-[--biqpod-secondary] font-bold text-transparent text-3xl text-center capitalize">
                    <Translate content="more" />
                  </h1>
                </div>
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
            <Route path="/client">
              <Client />
            </Route>
            <Route path="/feedbacks" exact>
              <FeedbackRoute />
            </Route>
            <Route path="/offers">
              <OffersPage />
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
            <Route path="/deliveries">
              <Deliveries />
            </Route>
            <Route path="*">
              <PageNotFound />
            </Route>
          </Switch>
        </Container>
        <RightSide />
      </Window>
      <Layoutes />
    </div>
  );
};
const tabServices = [
  {
    name: "Stores",
    link: "/store",
    photo: storePhoto,
  },
  {
    name: "Client",
    link: "/client",
    photo: clientPhoto,
  },
  {
    name: "Deliveries",
    link: "/deliveries",
    photo: deliveryPhoto,
  },
];
const extraTabs = [
  {
    name: "offers",
    link: "/offers",
    photo: offersPhoto,
  },
  {
    name: "feedbacks",
    link: "/feedbacks",
    photo: feedbackPhoto,
  },
];
