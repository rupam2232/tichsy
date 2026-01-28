"use client";
import axios from "@/utils/axiosInstance";
import { useEffect, useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { signOut } from "@/store/authSlice";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@repo/ui/types/ApiResponse";
import { Loader2 } from "lucide-react";
import { RestaurantStaffData } from "@repo/ui/types/Restaurant";
import AddStaffDialog from "@/components/add-staff-dialog";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [staffData, setStaffData] = useState<RestaurantStaffData | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const fetchStaffData = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const response = await axios.get(`/restaurant/${slug}/staff`);
      setStaffData(response.data.data);
    } catch (error) {
      console.error(
        "Failed to fetch staff data. Please try again later:",
        error
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch staff data. Please try again later"
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(
          "/signin?redirect=/restaurant/" + slug + "/staff-management"
        );
      }
    } finally {
      setIsPageLoading(false);
    }
  }, [slug, dispatch, router]);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  if (isPageLoading) {
    return (
      <div className="h-[95vh] flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="h-[95vh] flex items-center justify-center">
        <p className="text-muted-foreground">
          Something went wrong. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant staff here.
          </p>
        </div>
        <AddStaffDialog restaurantSlug={slug} />
      </div>
      <div className="mt-4">
        <p className="text-sm">Staff List:</p>
        <ul className="list-disc list-inside">
          {staffData.staffs && staffData.staffs.length > 0 ? (
            staffData.staffs.map((staff) => (
              <li key={staff._id}>
                {staff.firstName} {staff.lastName} - {staff.role}
              </li>
            ))
          ) : (
            <li>No staff members found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ClientPage;
