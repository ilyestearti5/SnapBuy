import React from "react";
import { Route } from "react-router-dom";
import { AnimatedPage } from "../animations/components";
import { FeedbackRoute } from "../routes/App/FeedbackRoute";
import { PageNotFound } from "../routes/App/PageNotFound";
import { OffersPage } from "../routes/App/OffersPage";
import { DeveloperRoute } from "../routes/Dev";
import { CollectionsRoute } from "../routes/Collections/CollectionsRoute";
import { Deliveries } from "../Deliveries";
import { Tracking } from "../Tracking";
import { Client } from "../routes/Clients/Client";
import { PackRoute } from "../Links/PackRoute";
import { ProductRoute } from "../Links/ProductRoute";
import { range, tw } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";

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

export const AppRoutes = React.memo(() => (
  <>
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
  </>
));
