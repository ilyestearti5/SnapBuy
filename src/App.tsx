import {
  Container,
  Header,
  Layoutes,
  LeftSide,
  ProfileView,
  RightSide,
  Window,
} from "biqpod/ui/layouts";
import { Redirect, Route, Switch } from "react-router";
import { HeaderContent } from "./HeaderContent";
import { useUser } from "biqpod/ui/hooks";
import prodPhoto from "../public/products.png";
import clientPhoto from "../public/clients.png";
import accountPhoto from "../public/account.png";
import shoppingPhoto from "../public/shopping.png";
import {
  Line,
  Translate,
  AsyncComponent,
  Card,
  ClickedView,
} from "biqpod/ui/components";
import { Link } from "react-router-dom";
import { getCurrentAuth } from "./server";
import { Producer } from "./Producer";
import { Client } from "./Client";
import { ClientAuth } from "./auth/ClientAuth";
import { AccountAuth } from "./auth/AccountAuth";
export const tabs = [
  {
    name: "orders",
    link: "/producer/orders",
    photo: shoppingPhoto,
  },
  {
    name: "products",
    link: "/producer/products",
    photo: prodPhoto,
  },
  {
    name: "clients",
    link: "/producer/clients",
    photo: clientPhoto,
  },
  {
    name: "accounts",
    link: "/producer/accounts",
    photo: accountPhoto,
  },
];
const RedirectToLoginIfNeeded = () => {
  const user = useUser();
  return (
    <AsyncComponent
      deps={[user]}
      render={async () => {
        const uid = await getCurrentAuth();
        if (uid) {
          return <Redirect to={"/profile"} />;
        } else {
          return <Redirect to={"/auth/login"} />;
        }
      }}
    />
  );
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
            <Route path="/auth/client">
              <ClientAuth />
            </Route>
            <Route path="/auth/account">
              <AccountAuth />
            </Route>
            <Route path="/profile" exact>
              <div className="flex flex-wrap justify-center items-center gap-2 w-full h-full">
                {mainTabs.map((tab) => {
                  return (
                    <Card className="overflow-hidden">
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
            <Route path="/client">
              <Client />
              <RedirectToLoginIfNeeded />
            </Route>
            <Route exact path="/auth/login">
              <ProfileView />
              <RedirectToLoginIfNeeded />
            </Route>
            <Route path="/" exact>
              <RedirectToLoginIfNeeded />
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
    link: "/client/change",
    photo: clientPhoto,
  },
  {
    name: "producer",
    link: "/producer/orders",
    photo: prodPhoto,
  },
  {
    name: "account",
    link: "/account",
    photo: accountPhoto,
  },
];
