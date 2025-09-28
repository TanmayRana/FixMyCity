"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAccessToken } from '@/lib/store/authSlice';

export function AuthInitializer() {
	const dispatch = useDispatch();

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
				if (res.ok) {
					const data = await res.json();
					dispatch(setAccessToken(data.token));
				}
			} catch {}
		})();
	}, [dispatch]);

	return null;
}


