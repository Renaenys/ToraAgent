'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		// ✅ Already logged in? Go to dashboard
		if (status === 'authenticated') {
			router.push('/dashboard');
		}
	}, [status]);

	const handleAuth = () => {
		if (status === 'authenticated') {
			signOut();
		} else {
			signIn('google');
		}
	};

	return (
		<main className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
			<button
				onClick={handleAuth}
				className={`${
					status === 'authenticated' ? 'bg-red-600' : 'bg-blue-600'
				} text-white px-6 py-3 rounded text-lg`}
			>
				{status === 'authenticated' ? 'Sign out' : 'Sign in with Google'}
			</button>
		</main>
	);
}
