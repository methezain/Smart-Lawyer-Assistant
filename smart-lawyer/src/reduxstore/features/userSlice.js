import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  contact: "",
  name: "",
  username: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      const { contact, name, username } = action.payload;
      state.contact = contact;
      state.name = name;
      state.username = username;
    },
    clearUserInfo: (state) => {
      state.contact = "";
      state.name = "";
      state.username = "";
    },
  },
});

export const { setUserInfo, unsetUserInfo } = userSlice.actions;

export const userReducer = userSlice.reducer;
