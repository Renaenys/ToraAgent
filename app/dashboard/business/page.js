'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ChartAiWidget from '@/components/ChartAiWidget';
import MarketingGenWidget from '@/components/MarketingGenWidget';
import AlignerWidget from '@/components/AlignerWidget';
import ChatBox from '@/components/ChatBox';
import VoiceChatBox from '@/components/VoiceChatBox';
import { CalendarProvider } from '@/context/CalendarContext';
import { ShoppingProvider } from '@/context/ShoppingContext';
import { ContactProvider } from '@/context/ContactContext';

export default function DashboardPage2() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [user, setUser] = useState(null);
	const [activeSessionId, setActiveSessionId] = useState(null);

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
		<DashboardLayout user={user}>
			<CalendarProvider>
				<ShoppingProvider>
					<ContactProvider>
						<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full h-full">
							{/* 📉 Chart AI */}
							<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col max-h-[calc(100vh-6rem)] overflow-auto">
								<h2 className="text-xl font-semibold mb-4">📉 Chart AI</h2>
								<ChartAiWidget email={user.email} />
							</div>

							{/* 💡 Marketing Generator */}
							<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col max-h-[calc(100vh-6rem)] overflow-auto">
								<h2 className="text-xl font-semibold mb-4">
									💡 Marketing Post
								</h2>
								<MarketingGenWidget />
							</div>

							{/* 📐 Aligner */}
							<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col max-h-[calc(100vh-6rem)] overflow-auto">
								<h2 className="text-xl font-semibold mb-4">📐 Aligner</h2>
								<AlignerWidget />
							</div>

							{/* 🎤 Assistant */}
							<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col max-h-[calc(100vh-6rem)] overflow-auto">
								<h2 className="text-xl font-semibold mb-4">🎤 AI Assistant</h2>
								<div className="flex-1 overflow-auto space-y-4">
									<ChatBox activeSessionId={activeSessionId} />
									<VoiceChatBox />
								</div>
							</div>
						</div>
					</ContactProvider>
				</ShoppingProvider>
			</CalendarProvider>
		</DashboardLayout>
	);
}
