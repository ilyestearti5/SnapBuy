import React from "react";
import { Route } from "react-router-dom";
import {
  AnimatedPage,
  AnimatedList,
  AnimatedListItem,
} from "../animations/components";
import { Section } from "../routes/App/Section";
import { ServiceCard } from "../components/ServiceCard";
import { EmptyComponent } from "@biqpod/app/ui/components";
import { appTabs, extraTabs, tabServices } from "../utils";
import { isWeb } from "@biqpod/app/ui/app";
import { Profile } from "../routes/App/Profile";
import { AgentAi } from "../Agent";

export const ProfileRoutes = React.memo(() => {
  const serviceCards = React.useMemo(
    () =>
      tabServices.map(({ link, name, photo }, index) => (
        <AnimatedListItem key={link} index={index}>
          <ServiceCard link={link} name={name} photo={photo} index={index} />
        </AnimatedListItem>
      )),
    []
  );

  const extraCards = React.useMemo(
    () =>
      extraTabs.map((tab, index) => (
        <AnimatedListItem key={tab.link} index={index}>
          <ServiceCard
            link={tab.link}
            name={tab.name}
            photo={tab.photo}
            index={index}
          />
        </AnimatedListItem>
      )),
    []
  );

  const appCards = React.useMemo(
    () =>
      isWeb
        ? appTabs.map((tab, index) => (
            <AnimatedListItem key={tab.url} index={index}>
              <ServiceCard
                link={tab.url}
                name={tab.name}
                photo={tab.photo}
                index={index}
                isExternal={true}
              />
            </AnimatedListItem>
          ))
        : [],
    []
  );

  return (
    <>
      <Route path="/agent">
        <Profile>
          <AgentAi />
        </Profile>
      </Route>
      <Route path="/profile" exact>
        <AnimatedPage className="flex flex-col w-full h-full">
          <Section text="service for" />
          <AnimatedList className="flex flex-wrap justify-center items-center gap-2 w-full">
            {serviceCards}
          </AnimatedList>
          <Section text="more" />
          <AnimatedList className="flex flex-wrap justify-center items-center gap-2 w-full">
            {extraCards}
          </AnimatedList>
          {isWeb && (
            <EmptyComponent>
              <Section text="apps" />
              <AnimatedList className="flex flex-wrap justify-center items-center gap-2 w-full">
                {appCards}
              </AnimatedList>
            </EmptyComponent>
          )}
        </AnimatedPage>
      </Route>
    </>
  );
});
