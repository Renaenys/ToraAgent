'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import CalendarWidget from '@/components/CalendarWidget';
import ChatBox from '@/components/ChatBox';
import ContactWidget from '@/components/ContactWidget';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import EmailWidget from '@/components/EmailWidget';
import ShoppingListWidget from '@/components/ShoppingListWidget';
import BriefingWidget from '@/components/BriefingWidget';
import VoiceChatBox from '@/components/VoiceChatBox';
import ChartAiWidget from '@/components/ChartAiWidget';

import { CalendarProvider } from '@/context/CalendarContext';
import { ShoppingProvider } from '@/context/ShoppingContext';
import { ContactProvider } from '@/context/ContactContext';

export default function DashboardPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isAllowed, setIsAllowed] = useState(null);
	const [user, setUser] = useState(null);
	const [activeSessionId, setActiveSessionId] = useState(null);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/login');
		}
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

	if (isAllowed === null) {
		return <div className="text-white p-6">Checking membership access...</div>;
	}

	return (
		<CalendarProvider>
			<ShoppingProvider>
				<ContactProvider>
					<div className="min-h-screen bg-[#0d1117] text-white p-4 pb-10">
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 h-screen">
							{/* Column 1 */}
							<div className="flex flex-col gap-4 h-full">
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
									<h2 className="text-xl font-semibold mb-4">📅 My Calendar</h2>
									<div className="overflow-auto flex-1 min-h-0">
										<CalendarWidget />
									</div>
								</div>
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
									<ShoppingListWidget />
								</div>
							</div>

							{/* Column 2 */}
							<div className="flex flex-col gap-4 h-full">
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
									<EmailWidget />
								</div>
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
									<h2 className="text-xl font-semibold mb-4">👥 My Contacts</h2>
									<ContactWidget />
								</div>
							</div>

							{/* Column 3 */}
							<div className="flex flex-col gap-4 h-full">
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
									<ChatHistorySidebar onSelect={setActiveSessionId} />
								</div>
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
									<BriefingWidget />
								</div>
							</div>

							{/* Column 4 - Assistant */}
							<div className="flex flex-col gap-4 h-full">
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
									<h2 className="text-xl font-semibold mb-4">🤖 Assistant</h2>
									<div className="flex-1 min-h-0 overflow-y-auto space-y-4">
										<ChatBox activeSessionId={activeSessionId} />
										{user?.membership === 'VIP2' && <VoiceChatBox />}
									</div>
								</div>
							</div>

							{/* Column 5 - Chart AI */}
							{user?.membership === 'VIP2' && (
								<div className="flex flex-col gap-4 h-full">
									<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
										<h2 className="text-xl font-semibold mb-4">
											📉 Chart AI (SMC Analysis)
										</h2>
										<div className="flex-1 overflow-y-auto">
											<ChartAiWidget email={user.email} />
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</ContactProvider>
			</ShoppingProvider>
		</CalendarProvider>
	);
}
