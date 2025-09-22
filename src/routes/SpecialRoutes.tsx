import { Route, Redirect } from "react-router-dom";
import { Profile } from "../routes/App/Profile";
import { ProfileView } from "@biqpod/app/ui/layouts";
import { LinkAccount } from "../LinkAccount";

export const SpecialRoutes = () => (
  <>
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
  </>
);
