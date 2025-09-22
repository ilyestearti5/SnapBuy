import { Route, Switch } from "react-router-dom";
import { AnimatedPage } from "../animations/components";
import { Profile } from "../routes/App/Profile";
import { Stores } from "../routes/Stores/Stores";
import { Store } from "../routes/Stores/Store";

export const StoreRoutes = () => (
  <Route path="/store">
    <Profile>
      <Switch>
        <Route path="/store" exact>
          <AnimatedPage>
            <Stores />
          </AnimatedPage>
        </Route>
        <Route path="/store/:storeId">
          <AnimatedPage>
            <Store />
          </AnimatedPage>
        </Route>
      </Switch>
    </Profile>
  </Route>
);
