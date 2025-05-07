'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import MarketingGenWidget from '@/components/MarketingGenWidget';

export default function MarketingDashboard() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [user, setUser] = useState(null);

	useEffect(() => {
		if (status === 'unauthenticated') router.push('/login');
	}, [status]);

	useEffect(() => {
		const checkMembership = async () => {
			if (status !== 'authenticated') return;
			try {
				const res = await fetch('/api/user/membership', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: session.user.email }),
				});
				const data = await res.json();
				const isExpired =
					!data.expireDate || new Date(data.expireDate) < new Date();
				if (data.membership !== 'VIP2' || isExpired) {
					router.push('/pricing');
				} else {
					setUser(data);
				}
			} catch (err) {
				console.error('❌ Error checking membership:', err);
				router.push('/pricing');
			}
		};
		checkMembership();
	}, [session, status]);

	if (!user) return <div className="text-white p-6">Loading...</div>;

	return (
		<DashboardLayout>
			<div className="w-full min-h-screen bg-[#0d1117] flex flex-col gap-6">
				<div className="bg-[#161b22] rounded-xl p-6 shadow-lg w-full max-w-5xl mx-auto">
					<h2 className="text-2xl font-semibold mb-4 text-white">
						💡 Marketing Generator (VIP2)
					</h2>
					<MarketingGenWidget />
				</div>
			</div>
		</DashboardLayout>
	);
}
