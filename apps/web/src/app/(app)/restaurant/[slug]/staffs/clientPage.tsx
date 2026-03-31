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
import { Loader2, LogOut, Mail, Trash2, User2, Users } from "lucide-react";
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  IconArchive,
  IconArchiveOff,
  IconDotsVertical,
} from "@tabler/icons-react";
import { getOptimizedUrl } from "@/utils/imageOptimizer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/utils";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";

const ClientPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  const [staffData, setStaffData] = useState<RestaurantStaffData | null>(null);
  const [invitations, setInvitations] = useState<
    {
      _id: string;
      email: string;
      role: string;
      expiresAt: string;
      status: string;
    }[]
  >([]);
  const router = useRouter();
  const dispatch = useDispatch();

  const activeRestaurant = useSelector(
    (state: RootState) => state.restaurantsSlice.activeRestaurant,
  );
  const role = activeRestaurant?.userRole;

  const [removingStaffId, setRemovingStaffId] = useState<string | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);
  const [archivingStaffId, setArchivingStaffId] = useState<string | null>(null);
  const [tab, setTab] = useState("active");

  const fetchStaffData = useCallback(async () => {
    try {
      setIsPageLoading(true);
      const [staffRes, inviteRes] = await Promise.all([
        axios.get(`/restaurant/${slug}/staff`),
        axios.get(`/invitation/${slug}`),
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
        router.push("/signin?redirect=/restaurant/" + slug + "/staffs");
      }
    } finally {
      setIsPageLoading(false);
    }
  }, [slug, dispatch, router]);

  const handleRemoveStaff = async (staffId: string) => {
    if (staffId === removingStaffId) {
      return;
    }
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
      toast.error(
        axiosError.response?.data.message || "Failed to remove staff",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=/restaurant/" + slug + "/staffs");
      }
    } finally {
      setRemovingStaffId(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (inviteId === revokingInviteId) {
      return;
    }
    try {
      setRevokingInviteId(inviteId);
      const response = await axios.delete(
        `/invitation/${slug}/${inviteId}/revoke`,
      );
      if (response.data.success) {
        toast.success("Invitation revoked successfully");
        setInvitations((prev) => prev.filter((inv) => inv._id !== inviteId));
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message || "Failed to revoke invitation",
      );
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=/restaurant/" + slug + "/staffs");
      }
    } finally {
      setRevokingInviteId(null);
    }
  };

  const toggleStaffArchive = async (staffId: string) => {
    if (staffId === archivingStaffId) {
      return;
    }
    const staff = staffData?.staffs.find((s) => s._id === staffId);
    if (!staff) return;
    try {
      setArchivingStaffId(staffId);
      setStaffData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          staffs: prev.staffs.map((s) =>
            s._id === staffId ? { ...s, isArchived: !s.isArchived } : s,
          ),
        };
      });
      const response = await axios.patch(
        `/restaurant/${slug}/staff/toggle-archive-status`,
        {
          staffId,
        },
      );
      if (response.data.success) {
        toast.success(
          response.data.message || "Staff member removed successfully",
        );
        setStaffData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            staffs: prev.staffs.map((s) =>
              s._id === staffId
                ? { ...s, isArchived: response.data.data.isArchived }
                : s,
            ),
          };
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(
        axiosError.response?.data.message || "Failed to archive staff",
      );
      setStaffData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          staffs: prev.staffs.map((s) =>
            s._id === staffId ? { ...s, isArchived: staff.isArchived } : s,
          ),
        };
      });
      if (axiosError.response?.status === 401) {
        dispatch(signOut());
        router.push("/signin?redirect=/restaurant/" + slug + "/staffs");
      }
    } finally {
      setArchivingStaffId(null);
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
    <div className="flex flex-1 flex-col px-4 lg:px-6 @container/main">
      <div className="flex items-center justify-between py-3 gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Staffs</h1>
          <p className="text-sm text-muted-foreground">
            Add and manage your restaurant staff members
          </p>
        </div>
        <AddStaffDialog
          restaurantSlug={slug}
          onInviteSuccess={(newInvite) => {
            setTab("invitations");
            setInvitations((prev) => [newInvite, ...prev]);
          }}
        />
      </div>
      <Tabs
        value={tab}
        onValueChange={setTab}
        defaultValue={tab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-primary transition-all duration-200 shadow-none"
          >
            Active Staff
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="data-[state=active]:bg-primary! data-[state=active]:text-primary-foreground! data-[state=active]:border-primary transition-all duration-200 shadow-none"
          >
            Invitations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <ul
            className={cn(
              "grid-cols-1 @md/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 @7xl/main:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500",
              staffData.staffs.length > 0 && "grid",
            )}
          >
            {staffData.staffs && staffData.staffs.length > 0 ? (
              staffData.staffs.map((staff) => (
                <li
                  key={staff._id}
                  className={cn(
                    "flex justify-between gap-x-2 items-center bg-muted/50 p-3 rounded-md",
                    staff.isArchived && "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="rounded-md">
                      <AvatarImage
                        src={getOptimizedUrl(staff.avatar, 150, 150)}
                        draggable={false}
                      />
                      <AvatarFallback className="rounded-md">
                        {staff.firstName?.charAt(0)}
                        {staff.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="w-3/5">
                    <p
                      className="font-medium truncate"
                      title={`${staff.firstName} ${staff.lastName}`}
                    >
                      {staff.firstName} {staff.lastName}
                    </p>
                    <p
                      className="text-xs text-muted-foreground truncate"
                      title={staff.email}
                    >
                      {staff.email}
                    </p>
                  </div>
                  {role === "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto">
                          <IconDotsVertical className="size-4" />
                          <span className="sr-only">options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel className="text-xs capitalize">
                          <div className="flex items-center justify-center gap-2">
                            <User2 className="size-4" />
                            {staff.role}
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              disabled={archivingStaffId === staff._id}
                              className="w-full justify-center px-2 py-1.5 h-auto"
                            >
                              {archivingStaffId === staff._id ? (
                                <>
                                  <Loader2 className="animate-spin" />
                                  Archiving...
                                </>
                              ) : staff.isArchived ? (
                                <>
                                  <IconArchiveOff />
                                  Unarchive
                                </>
                              ) : (
                                <>
                                  <IconArchive />
                                  Archive
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {staff.isArchived ? (
                                  <>
                                    This will unarchive {staff.firstName}{" "}
                                    {staff.lastName} from your restaurant. They
                                    will regain the access to this restaurant.
                                  </>
                                ) : (
                                  <>
                                    This will archive {staff.firstName}{" "}
                                    {staff.lastName} from your restaurant. They
                                    will lose the access to this restaurant.
                                  </>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => toggleStaffArchive(staff._id)}
                              >
                                {staff.isArchived ? "Unarchive" : "Archive"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              disabled={removingStaffId === staff._id}
                              className="!text-red-600 data-[variant=destructive]:*:[svg]:!text-red-600 w-full justify-center hover:bg-destructive/20 dark:hover:bg-destructive/30 px-2 py-1.5 h-auto"
                            >
                              {removingStaffId === staff._id ? (
                                <>
                                  <Loader2 className="animate-spin" />
                                  Removing...
                                </>
                              ) : (
                                <>
                                  <LogOut />
                                  Remove
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {staff.firstName}{" "}
                                {staff.lastName} from your restaurant. They will
                                no longer have access to this restaurant.
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              ))
            ) : (
              <li className="p-4 rounded-md text-center">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="size-9">
                      <Users className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>No staff member found</EmptyTitle>
                    <EmptyDescription>
                      Send an invitation to a staff member to add them to your
                      restaurant
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </li>
            )}
          </ul>
        </TabsContent>
        <TabsContent value="invitations">
          <ul
            className={cn(
              "grid-cols-1 @md/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 @7xl/main:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500",
              invitations.filter((inv) => inv.status === "pending").length >
                0 && "grid",
            )}
          >
            {invitations &&
            invitations.filter((inv) => inv.status === "pending").length > 0 ? (
              invitations
                .filter((inv) => inv.status === "pending")
                .map((invite) => (
                  <li
                    key={invite._id}
                    className="flex justify-between gap-x-2 items-center bg-muted/50 p-3 rounded-md"
                  >
                    <div className="w-3/5">
                      <p className="font-medium text-sm truncate">
                        {invite.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires:{" "}
                        {new Date(invite.expiresAt).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-full capitalize">
                        {invite.role}
                      </span>
                      {role === "owner" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={revokingInviteId === invite._id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              {revokingInviteId === invite._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Revoke Invitation
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to revoke the pending
                                invitation for {invite.email}? That user will no
                                longer be able to accept it.
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
              <li className="p-4 rounded-md text-center">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="size-9">
                      <Mail className="size-4" />
                    </EmptyMedia>
                    <EmptyDescription>
                      No pending invitation found
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </li>
            )}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientPage;
