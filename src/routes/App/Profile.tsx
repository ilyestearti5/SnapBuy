import { EmptyComponent } from "@biqpod/app/ui/components";
import { getTemp, useUser } from "@biqpod/app/ui/hooks";
import { Redirections } from "./RedirectToLoginIfNeeded";
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
