import { AnimatedPage } from "./animations";
import { Store } from "./routes/Stores/Store";

export const CheckBeforeShow = () => {
  return (
    <div className="h-full overflow-hidden">
      <AnimatedPage>
        <Store />
      </AnimatedPage>
    </div>
  );
};
