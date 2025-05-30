import { closePopup, useAsyncMemo, useUser } from "@biqpod/app/ui/hooks";
import React, { useMemo } from "react";
import { snapbuyApi } from "../apis";
import {
  Button,
  Card,
  CircleLoading,
  CircleTip,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { QRCodeSVG } from "qrcode.react";
import html2pdf from "html2pdf.js";
import { getDoc } from "../server";
interface OrderInvoiceProps {
  order: SnapBuy.Order;
}
export const OrderInvoice = ({ order }: OrderInvoiceProps) => {
  const invoiceRef = React.useRef<HTMLDivElement>(null);
  const user = useUser();

  const store = useAsyncMemo(async () => {
    return getDoc<SnapBuy.Store>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "stores",
      order.storeId,
    ]);
  }, []);

  const list = useAsyncMemo(async () => {
    return snapbuyApi.getOrderProducts(order.id);
  }, []);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    const element = invoiceRef.current;
    var result = await html2pdf().from(element).outputPdf("datauristring");
    // print
    var blob = await fetch(result).then((res) => res.blob());
    var url = URL.createObjectURL(blob);

    var win = window.open(url, "_blank");

    if (win) {
      win.onload = () => {
        win?.print();
      };
    }
  };

  const total = useMemo(() => {
    return list?.reduce((acc, current) => {
      return acc + (current.price || 0) * (current.count || 0);
    }, 0);
  }, [list]);

  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <h1 className="font-bold text-2xl">Invoice</h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      {list && (
        <Scroll className="bg-white">
          <div
            id="invoice-template"
            ref={invoiceRef}
            className="mx-auto w-[300px] h-full text-gray-700"
          >
            {/* Invoice Header */}
            <div className="flex justify-between items-start p-2">
              <div>
                {store?.photo ? (
                  <img
                    src={store.photo}
                    alt="Business Logo"
                    className="mb-2 h-16"
                  />
                ) : (
                  <h2 className="mb-1 font-bold text-invoice-primary text-2xl">
                    {user?.nickname || "Your Business"}
                  </h2>
                )}
                <div>
                  <p>{user?.email}</p>
                  <p>{store?.phone}</p>
                  <p>
                    <Translate content={order.status} />
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <h1 className="mb-2 font-bold text-[--biqpod-primary] text-2xl uppercase">
                  <Translate content="invoice" />
                </h1>
                <QRCodeSVG
                  width={70}
                  value={`${location.origin}/producer/orders?order=${order.id}`}
                />
                <p>
                  <span className="font-semibold">Date:</span>{" "}
                  {order.createdAt &&
                    new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Line />
            {/* Customer Details */}
            <div className="mb-2 px-2 py-1 rounded">
              <h3 className="mb-2 font-bold">Bill To:</h3>
              <div>
                <p className="font-semibold">
                  {order.client.firstname || "Customer Name"}
                </p>
                <p>{order.client.place.address || "Customer Address"}</p>
                <p>{order.client.phone || "Client Phone Number"}</p>
              </div>
            </div>
            {/* Invoice Items */}
            <Line />
            <table className="mb-2">
              <tbody>
                {list?.map((item) => (
                  <tr key={item.id} className="even:bg-[--biqpod-gray-opacity]">
                    <td className="px-2 pt-1 pb-4 text-xs">{item.name}</td>
                    <td className="px-2 pt-1 pb-4 text-xs text-right">
                      <span className="text-[--biqpod-success]">
                        {item.price.toFixed(0)}DA
                      </span>{" "}
                      *{" "}
                      <span className="text-[--biqpod-success]">
                        {item.quantity}
                      </span>{" "}
                      ={" "}
                      <span className="text-[--biqpod-success]">
                        {(item.price * item.count).toFixed(0)}DA
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Line />
            <div className="flex justify-between items-center p-2">
              <span />
              <div>
                <div className="flex justify-between items-center bg-invoice-secondary p-2 rounded">
                  <span className="font-semibold">Total : </span>
                  <span className="font-bold text-[--biqpod-success]">
                    {total?.toFixed(0)}DA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Scroll>
      )}
      {!list && (
        <div className="flex justify-center items-center h-full">
          <CircleLoading />
        </div>
      )}
      <Line />
      <div className="flex justify-between items-center p-4">
        <Button
          icon={allIcons.solid.faPrint}
          onClick={async () => {
            handleDownloadPDF();
          }}
        >
          <Translate content="print" />
        </Button>
      </div>
    </Card>
  );
};
