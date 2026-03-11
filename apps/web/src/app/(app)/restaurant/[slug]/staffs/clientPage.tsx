"use client";
import axios from "@/utils/axiosInstance";
import { useEffect, useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "@/store/authSlice";
import type { RootState } from "@/store/store";
import type { AxiosError } from "axios";
import type { ApiResponse, RestaurantStaffData } from "@repo/types";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import AddStaffDialog from "@/components/features/restaurant/add-staff-dialog";
import { Button } from "@repo/ui/components/button";
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

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [staffData, setStaffData] = useState<RestaurantStaffData | null>(null);
  const [invitations, setInvitations] = useState<{ _id: string, email: string, role: string, expiresAt: string, status: string }[]>([]);
  const router = useRouter();
  const dispatch = useDispatch();

  const activeRestaurant = useSelector((state: RootState) => state.restaurantsSlice.activeRestaurant);
  const role = activeRestaurant?.userRole;

  const [removingStaffId, setRemovingStaffId] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const fetchStaffData = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const [staffRes, inviteRes] = await Promise.all([
        axios.get(`/restaurant/${slug}/staff`),
        axios.get(`/invitation/${slug}`)
      ]);
      setStaffData(staffRes.data.data);
      setInvitations(inviteRes.data.data);
    } catch (error) {
      console.error(
        "Failed to fetch staff data. Please try again later:",
        error,
      );
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message ||
          "Failed to fetch staff data. Please try again later",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push(
          "/signin?redirect=/restaurant/" + slug + "/staffs",
        );
      }
    } finally {
      setIsPageLoading(false);
    }
  }, [slug, dispatch, router]);

  const handleRemoveStaff = async (staffId: string) => {
    try {
      setRemovingStaffId(staffId);
      const response = await axios.delete(`/restaurant/${slug}/staff`, {
        data: { staffId },
      });
      if (response.data.success) {
        toast.success("Staff member removed successfully");
        setStaffData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            staffs: prev.staffs.filter((s) => s._id !== staffId),
          };
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Failed to remove staff");
    } finally {
      setRemovingStaffId(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      setRevokingInviteId(inviteId);
      const response = await axios.delete(`/invitation/${slug}/${inviteId}/revoke`);
      if (response.data.success) {
        toast.success("Invitation revoked successfully");
        setInvitations((prev) => prev.filter((inv) => inv._id !== inviteId));
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Failed to revoke invitation");
    } finally {
      setRevokingInviteId(null);
    }
  };

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
          <h1 className="text-2xl font-bold">Staffs</h1>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant staff here
          </p>
        </div>
        <AddStaffDialog 
          restaurantSlug={slug} 
          onInviteSuccess={(newInvite) => setInvitations((prev) => [newInvite, ...prev])}
        />
      </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="font-semibold mb-3 border-b pb-2">Active Staff</p>
            <ul className="space-y-3">
              {staffData.staffs && staffData.staffs.length > 0 ? (
                staffData.staffs.map((staff) => (
                  <li key={staff._id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                    <div>
                      <p className="font-medium">{staff.firstName} {staff.lastName}</p>
                      <p className="text-xs text-muted-foreground">{staff.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">{staff.role}</span>
                      {role === "owner" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={removingStaffId === staff._id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              {removingStaffId === staff._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {staff.firstName} {staff.lastName} from your restaurant. They will no longer have access to this restaurant.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveStaff(staff._id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Remove Staff
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-md text-center">No staff members found.</li>
              )}
            </ul>
          </div>
          
          <div>
            <p className="font-semibold mb-3 border-b pb-2">Pending Invitations</p>
            <ul className="space-y-3">
              {invitations && invitations.filter(inv => inv.status === 'pending').length > 0 ? (
                invitations.filter(inv => inv.status === 'pending').map((invite) => (
                  <li key={invite._id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md border border-dashed border-border">
                    <div>
                      <p className="font-medium text-sm">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">Expires: {new Date(invite.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-full capitalize">{invite.role}</span>
                      {role === "owner" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={revokingInviteId === invite._id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              {revokingInviteId === invite._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to revoke the pending invitation for {invite.email}? That user will no longer be able to accept it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRevokeInvite(invite._id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-md text-center">No pending invitations.</li>
              )}
            </ul>
          </div>
        </div>
    </div>
  );
};

export default ClientPage;
