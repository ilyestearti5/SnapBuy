import {
  Container,
  Header,
  Layoutes,
  LeftSide,
  RightSide,
  Window,
} from "@biqpod/app/ui/layouts";
import { Switch } from "react-router-dom";
import { HeaderContent } from "./HeaderContent";
import { isAndroid, isIos } from "@biqpod/app/ui/app";
import { ProfileInside } from "./ProfileInside";
import { AnimatePresence } from "framer-motion";
import { useUrlSettings } from "./hooks/useUrlSettings";
import { AuthRoutes } from "./routes/AuthRoutes";
import { PaymentRoutes } from "./routes/PaymentRoutes";
import { ProfileRoutes } from "./routes/ProfileRoutes";
import { StoreRoutes } from "./routes/StoreRoutes";
import { AppRoutes } from "./routes/AppRoutes";
import { SpecialRoutes } from "./routes/SpecialRoutes";
export const App = () => {
  useUrlSettings();

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
          <AnimatePresence mode="wait">
            <Switch>
              <SpecialRoutes />
              <AuthRoutes />
              <PaymentRoutes />
              <ProfileRoutes />
              <StoreRoutes />
              <AppRoutes />
            </Switch>
          </AnimatePresence>
        </Container>
        <RightSide />
      </Window>
      <Layoutes profileContent={<ProfileInside />} />
    </div>
  );
};
