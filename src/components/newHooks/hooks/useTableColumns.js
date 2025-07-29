import Link from "next/link";

import { SortAsc, SortDesc, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteMessage } from "@/lib/queries/messageQueries";
import { handleApiRequest } from "@/lib/utils";

function useTableColumns({ fetchData, onLeadClick }) {
  const deleteContactMessage = async ({ websiteId, messageId }) => {
    if (confirm("Are you sure you want to delete this message?")) {
      await handleApiRequest({
        makeRequest: async () => {
          return deleteMessage(websiteId, messageId);
        },
        successCallback: () => {
          fetchData();
        },
      });
    }
  };

  return [
    {
      accessorKey: "email",
      header: ({ column }) => {
        return <div className=" font-medium text-base">Email</div>;
      },
      cell: ({ row }) => {
        // Convert all field keys to lowercase for easier access
        const fields = Object.fromEntries(
          Object.entries(row.original.fields).map(([key, value]) => [key.toLowerCase(), value])
        );

        return row.original.isSuspectedSpam ? (
          <span className="text-gray-500">Suspected Spam 🛑</span>
        ) : (
          <div className="underline lowercase block">{fields.email}</div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="flex items-center gap-2 group pl-0"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="font-medium text-base ">Submitted</span>
            <span className="text-gray-200 opacity-60">
              {column.getIsSorted() === "asc" ? (
                <SortDesc className="ml-2 h-4 w-4 text-gray-500" />
              ) : (
                <SortAsc className="ml-2 h-4 w-4 text-gray-500" />
              )}
            </span>
          </Button>
        );
      },
      cell: ({ row }) => {
        const createdAt = new Date(row.original.createdAt);
        return <div>{createdAt.toLocaleString()}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const message = row.original;
        return (
          <div className="flex gap-2 justify-end items-center">
            <Button variant="outline" onClick={() => onLeadClick(message)}>
              View
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                deleteContactMessage({
                  websiteId: message.websiteId,
                  messageId: message.id,
                })
              }
            >
              <Trash2 className="w-4 h-4 text-red-800" />
            </Button>
          </div>
        );
      },
    },
  ];
}

export default useTableColumns;
