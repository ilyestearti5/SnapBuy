import { Translate } from "@biqpod/app/ui/components";
import { Biqpod } from "@biqpod/app/ui/types";

export const InvoiceStatusBadge = ({
  status,
}: {
  status: Biqpod.Snapbuy.Invoice["status"];
}) => {
  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}
    >
      <Translate content={status} />
    </span>
  );
};
