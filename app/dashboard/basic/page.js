'use client';
import DashboardLayout from '@/components/DashboardLayout';
import CalendarWidget from '@/components/CalendarWidget';
import ChatBox from '@/components/ChatBox';
import ContactWidget from '@/components/ContactWidget';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import EmailWidget from '@/components/EmailWidget';
import ShoppingListWidget from '@/components/ShoppingListWidget';
import BriefingWidget from '@/components/BriefingWidget';
import VoiceChatBox from '@/components/VoiceChatBox';
import { CalendarProvider } from '@/context/CalendarContext';
import { ShoppingProvider } from '@/context/ShoppingContext';
import { ContactProvider } from '@/context/ContactContext';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BasicDashboard() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isAllowed, setIsAllowed] = useState(null);
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
				if (data.membership === 'None' || isExpired) {
					router.push('/pricing');
				} else {
					setIsAllowed(true);
					setUser(data);
				}
			} catch (err) {
				console.error('❌ Error checking membership:', err);
				router.push('/pricing');
			}
		};
		checkMembership();
	}, [session, status]);

	if (isAllowed === null)
		return <div className="text-white p-6">Checking membership access...</div>;

	return (
		<DashboardLayout user={user}>
			<CalendarProvider>
				<ShoppingProvider>
					<ContactProvider>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-h-[calc(100vh-5rem)] overflow-auto">
							<div className="flex flex-col gap-4">
								<div className="bg-[#111827]/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
									<CalendarWidget />
								</div>
								<div className="bg-[#111827]/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
									<ShoppingListWidget />
								</div>
							</div>
							<div className="flex flex-col gap-4">
								<div className="bg-[#111827]/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
									<EmailWidget />
								</div>
								<div className="bg-[#111827]/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
									<ContactWidget />
								</div>
							</div>
							<div className="flex flex-col gap-4">
								<div className="bg-[#111827]/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
									<ChatHistorySidebar onSelect={setActiveSessionId} />
								</div>
								<div className="bg-[#111827]/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
									<BriefingWidget />
								</div>
							</div>
							<div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden shadow-lg">
								<h2 className="text-xl font-semibold mb-4 text-white">
									💬 Assistant
								</h2>
								<div className="flex flex-col flex-1 min-h-0 gap-4">
									<div className="flex-1 overflow-auto">
										<ChatBox activeSessionId={activeSessionId} />
									</div>
									{user?.membership === 'VIP2' && (
										<div className="h-[140px] overflow-hidden">
											<VoiceChatBox />
										</div>
									)}
								</div>
							</div>
						</div>
					</ContactProvider>
				</ShoppingProvider>
			</CalendarProvider>
		</DashboardLayout>
	);
}
