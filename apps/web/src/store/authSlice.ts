import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  status: boolean;
  user: {
    _id: string;
    email: string;
    role: "admin" | "owner" | "staff";
    firstName: string;
    lastName?: string;
    avatar?: string;
  } | null;
}

const initialState: UserState = {
  status: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signIn(state, action: PayloadAction<UserState["user"]>) {
      state.status = true;
      state.user = action.payload;
    },
    updateProfile(state, action: PayloadAction<UserState["user"]>) {
      state.user = action.payload;
    },
    signOut(state) {
      state.status = false;
      state.user = null;
    },
  },
});

export const { signIn, updateProfile, signOut } = authSlice.actions;
export default authSlice.reducer;
