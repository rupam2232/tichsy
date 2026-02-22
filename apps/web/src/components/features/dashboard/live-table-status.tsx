"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import axios from "@/utils/axiosInstance";
import { Loader2, Table2 } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import type { AllTables, Table, ApiResponse, Order } from "@repo/types";
import { useSocket } from "@/context/SocketContext";

interface LiveTableStatusProps {
  slug: string;
}

export function LiveTableStatus({ slug }: LiveTableStatusProps) {
  const [tablesData, setTablesData] = useState<AllTables | null>(null);
  const [tablePage, setTablePage] = useState<number>(1);
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);
  const tableObserver = useRef<IntersectionObserver>(null);
  const socket = useSocket();

  const fetchTables = useCallback(
    async (page: number, append = false) => {
      if (!slug) return;
      try {
        if (append) setIsPageChanging(true);
        const res = await axios.get<ApiResponse<AllTables>>(
          `/table/${slug}?page=${page}&limit=20`,
        );

        if (res.data?.data) {
          setTablesData((prev) => {
            if (append && prev && res.data?.data) {
              return {
                ...res.data.data,
                tables: [...prev.tables, ...res.data.data.tables],
              };
            }
            return res.data?.data || null;
          });
        }
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      } finally {
        setIsPageChanging(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    fetchTables(1);
  }, [fetchTables]);

  useEffect(() => {
    if (tablePage > 1) fetchTables(tablePage, true);
  }, [tablePage, fetchTables]);

  const handleTableUpdated = useCallback(({ table }: { table: Table }) => {
    setTablesData((prev) => {
      if (!prev) return prev;

      const tableIndex = prev.tables.findIndex((t) => t._id === table._id);

      // If table isn't in our current sliced array, we don't need to update it
      if (tableIndex === -1) return prev;

      const newTables = [...prev.tables];
      const oldTable = newTables[tableIndex];
      newTables[tableIndex] = { ...oldTable, ...table };

      // Calculate new available/occupied counts if status changed
      let newAvailableCount = prev.availableTables;
      let newOccupiedCount = prev.occupiedTables;

      if (!oldTable?.isOccupied && table.isOccupied) {
        newAvailableCount--;
        newOccupiedCount++;
      } else if (oldTable?.isOccupied && !table.isOccupied) {
        newAvailableCount++;
        newOccupiedCount--;
      }

      return {
        ...prev,
        tables: newTables,
        availableTables: newAvailableCount,
        occupiedTables: newOccupiedCount,
      };
    });
  }, []);

  const handleNewOrder = useCallback(
    ({ order }: { order: Order }) => {
      if (order.table) {
        // If the order has an associated table, update it
        handleTableUpdated({
          table: { ...order.table, isOccupied: true } as Table,
        });
      }
    },
    [handleTableUpdated],
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("tableUpdated", handleTableUpdated);
    socket.on("newOrder", handleNewOrder);
    return () => {
      socket.off("tableUpdated", handleTableUpdated);
      socket.off("newOrder", handleNewOrder);
    };
  }, [socket, handleTableUpdated, handleNewOrder, fetchTables]);

  const lastTableElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (tableObserver.current) tableObserver.current.disconnect();
      tableObserver.current = new IntersectionObserver((entries) => {
        if (
          entries &&
          entries.length > 0 &&
          entries[0]?.isIntersecting &&
          tablesData &&
          tablesData.page < tablesData.totalPages
        ) {
          if (!isPageChanging) {
            setTablePage((prev) => prev + 1);
          }
        }
      });
      if (node) tableObserver.current.observe(node);
    },
    [tablesData, isPageChanging],
  );

  return (
    <section className="col-span-1 lg:col-span-5 flex flex-col gap-4 md:gap-6 bg-card p-6 md:p-8 rounded-[2rem] shadow-sm border border-border">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-800 text-foreground">Live Table Status</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-500/20"></div>
            <span className="font-medium text-xs text-muted-foreground">
              Available: {tablesData?.availableTables ?? 0}
            </span>
          </div>
          <div className="w-px h-3 bg-border"></div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/20"></div>
            <span className="font-medium text-xs text-muted-foreground">
              Occupied: {tablesData?.occupiedTables ?? 0}
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="lg:h-[400px] w-full pr-4">
        <div className="flex items-center flex-wrap gap-3 pb-4">
          {!tablesData?.tables || tablesData.tables.length === 0 ? (
            <div className="w-full py-12 text-center flex flex-col items-center gap-3">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <Table2 className="size-8" />
              </div>
              <p className="text-lg font-bold">No active table</p>
              <p className="text-sm text-muted-foreground">
                create a new table to see it&apos;s live status here
              </p>
            </div>
          ) : (
            tablesData.tables.map((t, index) => (
              <div
                key={t._id}
                ref={
                  index === tablesData.tables.length - 1
                    ? lastTableElementRef
                    : null
                }
                className={cn(
                  "rounded-lg p-3 flex flex-col items-center justify-center text-center border transition-all cursor-default shadow-sm w-[100px] h-[100px] gap-1",
                  t.isOccupied
                    ? "bg-red-100 text-red-700 border-red-200 shadow-red-100"
                    : "bg-green-100 text-green-700 border-green-200 shadow-green-100",
                )}
              >
                <span className="font-bold text-sm w-full px-1">
                  {t.tableName}
                </span>
              </div>
            ))
          )}
          {isPageChanging && (
            <div className="w-full flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>
    </section>
  );
}
