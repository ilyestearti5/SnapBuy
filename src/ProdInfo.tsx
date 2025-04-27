import { Line, Translate } from "biqpod/ui/components";
interface ProdInfoProps {
  product: SnapBuy.Product;
}
export const ProdInfo = ({ product }: ProdInfoProps) => {
  return (
    <div className="flex flex-col">
      <div className="relative flex justify-center items-center h-[200px] overflow-hidden">
        <img
          draggable="false"
          src={product.photo}
          className="absolute inset-0 opacity-20 blur-lg object-cover"
        />
        <img
          draggable="false"
          src={product.photo}
          className="w-full h-full object-contain"
        />
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
            {product.price.toFixed(2)}DA
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
          <Translate content="market" />: {product.market}
        </p>
      </div>
    </div>
  );
};
