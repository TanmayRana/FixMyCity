import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UserInfo = {
	_id: string;
	name: string;
	email: string;
	role: string;
	department?: string | null;
	phone?: string | null;
	address?: string | null;
} | null;

type AuthState = {
	accessToken: string | null;
	user: UserInfo;
	isHydrated: boolean;
};

const initialState: AuthState = {
	accessToken: null,
	user: null,
	isHydrated: false,
};

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setCredentials(state, action: PayloadAction<{ token: string; user: UserInfo }>) {
			state.accessToken = action.payload.token;
			state.user = action.payload.user;
			state.isHydrated = true;
		},
		setAccessToken(state, action: PayloadAction<string | null>) {
			state.accessToken = action.payload;
			state.isHydrated = true;
		},
		clearAuth(state) {
			state.accessToken = null;
			state.user = null;
			state.isHydrated = true;
		},
	},
});

export const { setCredentials, setAccessToken, clearAuth } = authSlice.actions;
export const authReducer = authSlice.reducer;


