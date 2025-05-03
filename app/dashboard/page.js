'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CalendarWidget from '@/components/CalendarWidget';
import ChatBox from '@/components/ChatBox';
import ContactWidget from '@/components/ContactWidget';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import { ContactProvider } from '@/context/ContactContext';
import EmailWidget from '@/components/EmailWidget';
import { CalendarProvider } from '@/context/CalendarContext';
import ShoppingListWidget from '@/components/ShoppingListWidget';
import { ShoppingProvider } from '@/context/ShoppingContext';
import BriefingWidget from '@/components/BriefingWidget';

export default function DashboardPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isAllowed, setIsAllowed] = useState(null);
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
					<div className="min-h-screen bg-[#0d1117] text-white p-4 flex flex-col gap-4 overflow-hidden">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:h-screen">
							{/* Column 1 */}
							<div className="flex flex-col gap-4 h-full overflow-hidden min-h-0">
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col overflow-hidden min-h-0">
									<h2 className="text-xl font-semibold mb-4">📅 My Calendar</h2>
									<CalendarWidget />
								</div>
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col">
									<ShoppingListWidget />
								</div>
							</div>

							{/* Column 2 */}
							<div className="flex flex-col gap-4 h-full overflow-hidden min-h-0">
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col overflow-hidden min-h-0">
									<EmailWidget />
								</div>
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col">
									<h2 className="text-xl font-semibold mb-4">👥 My Contacts</h2>
									<ContactWidget />
								</div>
							</div>

							{/* Column 3 - Chat History & Briefing */}
							<div className="flex flex-col gap-4 h-full overflow-hidden min-h-0">
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col overflow-hidden min-h-0">
									<ChatHistorySidebar onSelect={setActiveSessionId} />
								</div>
								<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col">
									<BriefingWidget />
								</div>
							</div>

							{/* Column 4 - Assistant */}
							<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex-1 flex flex-col overflow-hidden min-h-0 lg:h-full h-[calc(100vh-8rem)]">
								<h2 className="text-xl font-semibold mb-4">🤖 Assistant</h2>
								<div className="flex-1 min-h-0 overflow-y-auto">
									<ChatBox activeSessionId={activeSessionId} />
								</div>
							</div>
						</div>
					</div>
				</ContactProvider>
			</ShoppingProvider>
		</CalendarProvider>
	);
}
