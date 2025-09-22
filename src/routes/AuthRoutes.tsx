import { Route, Redirect } from "react-router-dom";
import { AuthRoute, PayoutRoute } from "@biqpod/app/ui/routes";
import { Profile } from "../routes/App/Profile";
import { AnimatedPage, AnimatedCard } from "../animations/components";
import { Line, Translate, Button } from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import payChecked from "../assets/payment-checked.png";

export const AuthRoutes = () => (
  <>
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
  </>
);
