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
import { PayoutRoute } from "@biqpod/app/ui/routes";
import { HeaderContent } from "./HeaderContent";
import prodPhoto from "../public/products.png";
import clientPhoto from "../public/clients.png";
import shoppingPhoto from "../public/shopping.png";
import feedbackPhoto from "../public/feedback.png";
import overviewPhoto from "../public/overview.png";
import unpaidPhoto from "../public/unpaied.jpg";
import integrationsPhoto from "../public/integrations.png";
import {
  Line,
  Translate,
  Card,
  ClickedView,
  Button,
} from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { Producer } from "./Producer";
import { Client } from "./Client";
import { FeedbackRoute } from "./FeedbackRoute";
import { RedirectToLoginIfNeeded } from "./RedirectToLoginIfNeeded";
import { allIcons } from "@biqpod/app/ui/apis";
import { Plans } from "./Plans";
import { PageNotFound } from "./PageNotFound";
import { ProductRoute } from "./Links/ProductRoute";
import payChecked from "../public/payment-checked.png";
export const userTabs = [
  {
    name: "overview",
    link: "/producer/overview",
    photo: overviewPhoto,
  },
  {
    name: "products",
    link: "/producer/products",
    photo: prodPhoto,
  },
  {
    name: "orders",
    link: "/producer/orders",
    photo: shoppingPhoto,
  },
  {
    name: "integrations",
    link: "/producer/integrations",
    photo: integrationsPhoto,
  },
];
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
              <div className="flex flex-wrap justify-center items-center gap-2 w-full h-full">
                {mainTabs.map((tab) => {
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
              <RedirectToLoginIfNeeded />
            </Route>
            <Route path="/producer">
              <Producer />
              <RedirectToLoginIfNeeded />
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
            <Route exact path="/">
              <RedirectToLoginIfNeeded onDone={<Redirect to="/profile" />} />
            </Route>
            <Route exact path="/auth/login">
              <ProfileView />
              <RedirectToLoginIfNeeded onDone={<Redirect to="/profile" />} />
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
const mainTabs = [
  {
    name: "client",
    link: "/client",
    photo: clientPhoto,
  },
  {
    name: "producer",
    link: "/producer/orders",
    photo: prodPhoto,
  },
  {
    name: "feedbacks",
    link: "/feedbacks",
    photo: feedbackPhoto,
  },
];
