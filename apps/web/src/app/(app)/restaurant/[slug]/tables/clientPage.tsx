"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card } from "@repo/ui/components/card";
import { cn } from "@repo/ui/lib/utils";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { ApiResponse, Table, AllTables } from "@repo/types";
import axios from "@/utils/axiosInstance";
import { useParams } from "next/navigation";
import TableDetails from "@/components/features/restaurant/table-details";
import CreateTableDialog from "@/components/features/restaurant/create-table";
import type { AppDispatch, RootState } from "@/store/store";
import { Plus } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { IconTable } from "@tabler/icons-react";

export default function SelectTable() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [allTables, setAllTables] = useState<AllTables | null>(null);
  const observer = useRef<IntersectionObserver>(null);
  const activeRestaurant = useSelector((state: RootState) => state.restaurantsSlice.activeRestaurant);

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
  };

  const handleDeselectTable = () => {
    setSelectedTable(null);
  };

  const fetchAllTables = useCallback(async () => {
    if (!slug) {
      console.error("Restaurant slug is required to fetch tables");
      toast.error("Restaurant slug is required to fetch tables");
      return;
    }
    try {
      if (page === 1) {
        setIsPageLoading(true);
        const response = await axios.get(`/table/${slug}?limit=20&includeArchived=true`);
        setAllTables(response.data.data);
      } else {
        setIsPageChanging(true);
        const response = await axios.get(
          `/table/${slug}?page=${page}&limit=20&includeArchived=true`,
        );
        setAllTables((prev) => ({
          ...response.data.data,
          tables: [...(prev?.tables || []), ...response.data.data.tables],
        }));
      }
    } catch (error) {
      console.error(
        "Failed to fetch all tables. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch all tables. Please try again later",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(`/signin?redirect=/restaurant/${slug}/tables`);
      }
      setAllTables(null);
    } finally {
      setIsPageChanging(false);
      setIsPageLoading(false);
    }
  }, [slug, router, dispatch, page]);

  useEffect(() => {
    fetchAllTables();
  }, [slug, fetchAllTables]);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries && Array.isArray(entries) && entries[0]?.isIntersecting) {
        if (allTables && allTables?.totalPages > page) {
          if (isPageChanging) return;
          setPage((prevPageNumber) => prevPageNumber + 1);
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [allTables, page, isPageChanging]);

  return (
    <section className="@container/main">
      {/* Header */}
      <div className="flex flex-col-reverse sm:flex-row gap-y-2 items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-500/20"></span>
            <span className="text-muted-foreground">
              Available: {allTables ? allTables.availableTables : 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/20"></span>
            <span className="text-muted-foreground">
              Occupied: {allTables ? allTables.occupiedTables : 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted ring-2 ring-secondary-foreground/20"></span>
            <span className="text-muted-foreground">
              Archived: {allTables ? allTables.archivedTables : 0}
            </span>
          </div>
        </div>
        {allTables &&
          Array.isArray(allTables.tables) &&
          allTables.tables.length > 0 &&
          activeRestaurant?.userRole === "owner" && (
            <div>
              <CreateTableDialog
                isLoading={isPageLoading}
                restaurantSlug={slug}
                setAllTables={setAllTables}
              >
                <Plus /> New Table
              </CreateTableDialog>
            </div>
          )}
      </div>

      {/* Main Content Area */}
      {isPageLoading ? (
        <div className="grid grid-cols-2 @md/main:grid-cols-3 @2xl/main:grid-cols-4 @4xl/main:grid-cols-5 @5xl/main:grid-cols-6 gap-4 p-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="flex items-center justify-center">
              <Card className="flex items-center justify-center h-[100px] w-full bg-muted text-muted-foreground animate-pulse"></Card>
            </div>
          ))}
        </div>
      ) : allTables &&
        Array.isArray(allTables.tables) &&
        allTables.tables.length > 0 ? (
        <div className="grid grid-cols-2 @md/main:grid-cols-3 @2xl/main:grid-cols-4 @4xl/main:grid-cols-5 @5xl/main:grid-cols-6 gap-4 p-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {allTables.tables.map((table, index) => {
            const isSelected = selectedTable?._id === table._id;

            return (
              <div
                key={table._id}
                ref={
                  allTables.tables.length - 1 === index ? lastElementRef : null
                }
              >
                <TableDetails
                  table={table}
                  setAllTables={setAllTables}
                  isSelected={isSelected}
                  handleDeselectTable={handleDeselectTable}
                  restaurantSlug={slug}
                >
                  <div
                    className={cn(
                      "rounded-lg ring-3 ring-transparent cursor-pointer transition-all duration-200 relative  p-0.5 z-20",
                      isSelected && table.isArchived
                        ? "ring-secondary-foreground/50"
                        : isSelected && table.isOccupied
                          ? "ring-destructive"
                          : isSelected && "ring-primary",
                      table.isArchived
                        ? "hover:ring-secondary-foreground/50"
                        : table.isOccupied
                          ? "hover:ring-destructive"
                          : "hover:ring-primary",
                    )}
                    onClick={() => handleTableSelect(table)}
                  >
                    <Card
                      className={cn(
                        "flex items-center justify-center cursor-pointer transition-all duration-200 rounded-lg truncate whitespace-pre-wrap min-h-[100px]",
                        table.isArchived
                          ? "bg-muted text-muted-foreground/80 border"
                          : table.isOccupied
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-green-100 text-green-700 border-green-200",
                      )}
                    >
                      <span className="font-medium text-xs text-center text-balance">
                        {table.tableName}
                      </span>
                    </Card>
                  </div>
                </TableDetails>
              </div>
            );
          })}
          {isPageChanging &&
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-center">
                <Card className="flex items-center justify-center h-[100px] w-full bg-muted text-muted-foreground animate-pulse"></Card>
              </div>
            ))}
        </div>
      ) : (
        <Empty className="animate-in fade-in slide-in-from-top-4 duration-500 mt-12">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="size-9">
              <IconTable className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No tables found</EmptyTitle>
            <EmptyDescription>
              This restaurant has no tables yet. Get started by creating a new
              table
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {activeRestaurant?.userRole === "owner" && (
              <CreateTableDialog
                isLoading={isPageLoading}
                restaurantSlug={slug}
                setAllTables={setAllTables}
              >
                Create New Table
              </CreateTableDialog>
            )}
          </EmptyContent>
        </Empty>
      )}
    </section>
  );
}
