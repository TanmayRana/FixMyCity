import { clearAuth } from '@/lib/store/authSlice';
import { store } from '@/lib/store';

export async function logout() {
	try {
		await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
	} finally {
		store.dispatch(clearAuth());
	}
}


