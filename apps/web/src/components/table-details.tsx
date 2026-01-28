import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { signOut } from "@/store/authSlice";
import { useRouter, usePathname } from "next/navigation";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/ui/types/ApiResponse";
import axios from "@/utils/axiosInstance";
import type { Table, TableDetails, AllTables } from "@repo/ui/types/Table";
import { Pen, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { tableSchema } from "@/schemas/tableSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import TableQRCode from "./table-qrcode";
import { IconReceipt } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";

const TableDetails = ({
  children,
  table,
  setAllTables,
  isSelected,
  handleDeselectTable,
  restaurantSlug,
}: {
  children: React.ReactNode;
  table: Table;
  setAllTables: React.Dispatch<React.SetStateAction<AllTables | null>>;
  isSelected: boolean;
  handleDeselectTable: () => void;
  restaurantSlug: string;
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [tableDetails, setTableDetails] = useState<TableDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [isTableOccupied, setIsTableOccupied] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const sheetCloseRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchTableDetails();
      setIsOpen(true);
      window.history.pushState(
        { tableSlug: table.qrSlug },
        "",
        window.location.href
      );
    } else {
      window.history.back();
      setIsEditing(false);
      handleDeselectTable();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setIsOpen(false);
      setIsEditing(false);
      handleDeselectTable();
    };

    if (isOpen) {
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchTableDetails = useCallback(async () => {
    if (!table || !table.qrSlug) {
      console.warn("No table selected or table does not have a qrSlug");
      setTableDetails(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/table/${restaurantSlug}/${table.qrSlug}`
      );
      setIsTableOccupied(response.data.data.isOccupied);
      setTableDetails(response.data.data);
      setAllTables((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.map((table) => {
            if (table.qrSlug === response.data.data.qrSlug) {
              return {
                ...table,
                isOccupied: response.data.data.isOccupied ?? table.isOccupied,
                qrSlug: response.data.data.qrSlug ?? table.qrSlug,
                tableName: response.data.data.tableName ?? table.tableName,
                seatCount: response.data.data.seatCount ?? table.seatCount,
              };
            }
            return table;
          }),
        };
      });
    } catch (error) {
      console.error(
        "Failed to fetch table details. Please try again later:",
        error
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch table details. Please try again later"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
      setTableDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, restaurantSlug, router, table, pathname, setAllTables]);

  const form = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      tableName: table.tableName,
      seatCount: table.seatCount || 1, // Default to 1 if not provided
    },
  });

  const onSubmit = async (data: z.infer<typeof tableSchema>) => {
    if (isLoading || formLoading) return; // Prevent multiple submissions
    if (!user || user.role !== "owner") {
      toast.error("You do not have permission to edit tables");
      return;
    }
    if (
      form.getValues("tableName") === table.tableName &&
      form.getValues("seatCount") === table.seatCount
    ) {
      toast.error(
        "No changes detected. Please modify the table details before submitting"
      );
      return;
    }
    try {
      setFormLoading(true);
      const response = await axios.patch(
        `/table/${restaurantSlug}/${table.qrSlug}`,
        data
      );
      if (
        !response.data.success ||
        !response.data.data.table ||
        !response.data.data.table.tableName ||
        response.data.data.table.seatCount === undefined
      ) {
        toast.error(response.data.message || "Failed to create restaurant");
        return;
      }
      setTableDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tableName: response.data.data.table.tableName,
          seatCount: response.data.data.table.seatCount,
          qrSlug: response.data.data.table.qrSlug ?? prev.qrSlug,
          isOccupied: response.data.data.table.isOccupied ?? prev.isOccupied,
        };
      });
      setIsEditing(false);
      setAllTables((prev) => {
        if (!prev) return prev; // If allTables is null, return it
        return {
          ...prev,
          tables: prev.tables.map((t) =>
            t.qrSlug === table.qrSlug
              ? {
                  ...t,
                  tableName: response.data.data.table.tableName,
                  seatCount: response.data.data.table.seatCount,
                  qrSlug: response.data.data.table.qrSlug ?? t.qrSlug,
                  isOccupied:
                    response.data.data.table.isOccupied ?? t.isOccupied,
                }
              : t
          ),
          totalCount: response.data.data.totalCount ?? prev.totalCount,
          occupiedTables:
            response.data.data.occupiedTables ?? prev.occupiedTables,
          availableTables:
            response.data.data.availableTables ?? prev.availableTables,
        };
      });
      toast.success(response.data.message || "Table updated successfully!");
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "An error occurred during table update"
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred during table update"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const toggleOccupiedStatus = async () => {
    if (!tableDetails) return;
    if (isLoading || formLoading) {
      toast.error("Please wait for the current operation to complete");
      return;
    } // Prevent multiple submissions
    try {
      setFormLoading(true);
      const response = await axios.patch(
        `/table/${restaurantSlug}/${tableDetails.qrSlug}/toggle-occupied`
      );
      if (
        !response.data.success ||
        !response.data.data.table ||
        response.data.data.table.isOccupied === undefined
      ) {
        toast.error(response.data.message || "Failed to update table status");
        return;
      }
      setTableDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isOccupied: response.data.data.table.isOccupied,
          qrSlug: response.data.data.table.qrSlug ?? prev.qrSlug,
          tableName: response.data.data.table.tableName ?? prev.tableName,
          seatCount: response.data.data.table.seatCount ?? prev.seatCount,
        };
      });

      setAllTables((prev) => {
        if (!prev) return prev; // If allTables is null, return it
        return {
          ...prev,
          tables: prev.tables.map((t) =>
            t.qrSlug === tableDetails.qrSlug
              ? {
                  ...t,
                  isOccupied: response.data.data.table.isOccupied,
                  qrSlug: response.data.data.table.qrSlug ?? t.qrSlug,
                  tableName: response.data.data.table.tableName ?? t.tableName,
                  seatCount: response.data.data.table.seatCount ?? t.seatCount,
                }
              : t
          ),
          totalCount: response.data.data.totalCount ?? prev.totalCount,
          occupiedTables:
            response.data.data.occupiedTables ?? prev.occupiedTables,
          availableTables:
            response.data.data.availableTables ?? prev.availableTables,
        };
      });
      toast.success("Table status updated successfully!");
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "An error occurred during table status update"
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred during table status update"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
      setIsTableOccupied((prev) => !prev); // Toggle back the status on error
    } finally {
      setFormLoading(false);
    }
  };

  const deleteTable = async () => {
    if (!tableDetails) return;
    if (isLoading || formLoading) {
      toast.error("Please wait for the current operation to complete");
      return; // Prevent multiple submissions
    }

    try {
      setFormLoading(true);
      const response = await axios.delete(
        `/table/${restaurantSlug}/${tableDetails.qrSlug}`
      );
      if (!response.data.success) {
        toast.error(response.data.message || "Failed to delete table");
        return;
      }
      sheetCloseRef.current?.click(); // Close the sheet after deletion
      handleDeselectTable(); // Deselect the table after deletion
      toast.success("Table deleted successfully!");
      setAllTables((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.filter((t) => t.qrSlug !== tableDetails.qrSlug),
        };
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "An error occurred during table deletion"
      );
      console.error(
        axiosError.response?.data.message ||
          "An error occurred during table deletion"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=${pathname}`);
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Sheet
      defaultOpen={isSelected}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full">
        <SheetHeader>
          <SheetTitle>
            {isEditing
              ? `Editing Table: ${table.tableName}`
              : tableDetails
                ? `Table: ${tableDetails.tableName}`
                : "Table Details"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Edit the details of this table."
              : tableDetails
                ? `View details and manage table`
                : "Select a table to view its details."}
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin" />
          </div>
        ) : isEditing ? (
          <div className="px-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <ArrowLeft />
              Back to Details
            </Button>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="tableName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="tableName">Table Name</FormLabel>
                        <FormControl>
                          <Input
                            id="tableName"
                            type="text"
                            placeholder="E.g., Table 1"
                            autoComplete="table-name"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Every table name must be unique
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seatCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="seatCount">Seat Count</FormLabel>
                        <FormControl>
                          <Input
                            id="seatCount"
                            type="number"
                            placeholder="E.g., 4"
                            autoComplete="seat-count"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Number of seats at this table
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || formLoading}
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Table"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        ) : tableDetails ? (
          <div className="grid flex-1 auto-rows-min gap-4 px-4 text-sm font-medium">
            <div className="flex items-center justify-between gap-2">
              <p className="whitespace-pre-wrap">
                Table Name:{" "}
                <span className="font-bold">{tableDetails.tableName}</span>
              </p>

              <TableQRCode
                qrCodeData={`${window.location.origin}/${tableDetails?.restaurantDetails?.slug}/menu?tableId=${tableDetails.qrSlug}`}
                qrCodeImage={tableDetails.restaurantDetails.logoUrl?.replace(
                  "/upload/",
                  "/upload/r_max/"
                )}
                qrCodeName={tableDetails.tableName + "-qrcode"}
              />
            </div>
            <p>
              Seat Count:{" "}
              <span className="font-bold">{tableDetails.seatCount}</span>
            </p>
            <p className="flex items-center gap-2">
              Status:
              <Select
                value={isTableOccupied ? "occupied" : "available"}
                disabled={!user}
                defaultValue={
                  tableDetails.isOccupied ? "occupied" : "available"
                }
                onValueChange={() => {
                  setIsTableOccupied((prev) => !prev);
                  toggleOccupiedStatus();
                }}
              >
                <SelectTrigger className="text-sm font-medium w-[180px] border-muted-foreground/70">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                </SelectContent>
              </Select>
            </p>

            <p>
              slug: <span className="font-bold">{tableDetails.qrSlug}</span>
            </p>

            {tableDetails.currentOrder &&
              tableDetails.currentOrder.foodItems &&
              Array.isArray(tableDetails.currentOrder.foodItems) &&
              tableDetails.currentOrder.foodItems.length > 0 && (
                <div>
                  <Button
                    variant={"outline"}
                    onClick={() =>
                      router.push(
                        `/restaurant/${tableDetails.restaurantDetails.slug}/orders?tab=search&search=${tableDetails.currentOrder?.orderNo}`
                      )
                    }
                    className=""
                  >
                    <IconReceipt />
                    View Order
                  </Button>
                </div>
              )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>No details available for this table.</p>
          </div>
        )}
        <SheetFooter className="flex flex-row items-center justify-between">
          <SheetClose asChild ref={sheetCloseRef} />

          {!isEditing && user?.role === "owner" && !isEditing && (
            <Button
              type="button"
              className="w-2/4"
              onClick={() => setIsEditing(true)}
            >
              <Pen />
              Edit
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isLoading || formLoading}
                type="button"
                className="w-1/3 bg-red-500 hover:bg-red-600 text-white ml-auto"
              >
                <Trash2 />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  table and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={deleteTable}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TableDetails;
