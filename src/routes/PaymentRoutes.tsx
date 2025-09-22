import { Route } from "react-router-dom";
import { AnimatedPage, AnimatedCard } from "../animations/components";
import { Line, Translate, Button } from "@biqpod/app/ui/components";
import { Link } from "react-router-dom";
import { allIcons } from "@biqpod/app/ui/apis";
import unpaidPhoto from "../assets/unpaied.jpg";
import { Plans } from "../routes/App/Plans";

export const PaymentRoutes = () => (
  <>
    <Route path="/payment" exact>
      <AnimatedPage className="flex flex-col justify-center items-center gap-2 w-full h-full">
        <AnimatedCard className="overflow-hidden">
          <div className="flex w-[60vw]">
            <img src={unpaidPhoto} className="w-full h-full object-cover" />
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
        </AnimatedCard>
      </AnimatedPage>
    </Route>
    <Route path="/plans" exact>
      <AnimatedPage>
        <Plans />
      </AnimatedPage>
    </Route>
  </>
);
