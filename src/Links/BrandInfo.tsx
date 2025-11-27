import {
  AsyncComponent,
  EmptyComponent,
  CardWait,
} from "@biqpod/app/ui/components";
import { snapbuyApi } from "../apis";

interface BrandInfoProps {
  brandId?: string;
}
export const BrandInfo = ({ brandId }: BrandInfoProps) => {
  return (
    <AsyncComponent
      deps={[brandId]}
      render={async () => {
        if (!brandId) {
          return <EmptyComponent />;
        }
        const brand = await snapbuyApi.brands.get(brandId);
        if (!brand) {
          return <EmptyComponent />;
        }
        return <EmptyComponent>{brand.name}</EmptyComponent>;
      }}
      loading={<CardWait className="rounded-2xl w-[150px] h-[20px]" />}
    />
  );
};
