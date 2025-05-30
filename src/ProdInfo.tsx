import { Line, Translate } from "@biqpod/app/ui/components";
import { getPrice } from "./CartPopup";
import { ImageSlider } from "./Links/ImageSlider";
interface ProdInfoProps {
  product: SnapBuy.Product;
}
export const ProdInfo = ({ product }: ProdInfoProps) => {
  const photos = product.photos || [];
  const { price } = getPrice(product);
  return (
    <div className="flex flex-col">
      <div className="relative flex justify-center items-center w-full h-[200px] cursor-pointer">
        <ImageSlider photos={photos} />
        {product.available && (
          <div className="top-0 right-0 absolute bg-[--biqpod-primary] px-3 py-1 rounded-es-2xl text-[--biqpod-primary-content] capitalize">
            <Translate content="available" />
          </div>
        )}
      </div>
      <Line />
      <div className="bg-[--biqpod-primary-background] p-2">
        <h1 className="text-2xl">{product.name}</h1>
      </div>
      <Line />
      <div className="p-2">
        <p>{product.description}</p>
        <p>
          Price:{" "}
          <span className="bg-[--biqpod-primary] px-3 rounded-full text-[--biqpod-primary-content]">
            {price?.toFixed(2)}DA
          </span>
        </p>
        <p>Category: {product.category}</p>
      </div>
      <Line />
      <div className="p-2 capitalize">
        <p>
          <Translate content="available" />: {product.available ? "Yes" : "No"}
        </p>
        <p>
          <Translate content="market" />: {product.category}
        </p>
      </div>
    </div>
  );
};
