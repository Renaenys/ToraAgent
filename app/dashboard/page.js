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


export default function DashboardPage() {
	const [activeSessionId, setActiveSessionId] = useState(null);
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/login');
		}
	}, [status]);

	return (
		<CalendarProvider>
			<ContactProvider>
				<div className="h-screen bg-[#0d1117] text-white p-4 flex flex-col lg:flex-row gap-4 max-w-full overflow-x-hidden">
					<div className="w-full max-w-screen-2xl flex flex-col lg:flex-row gap-4">
						{/* Left Column */}
						<div className="flex flex-col gap-4 basis-1/5 min-w-[400px]">
							<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col h-[70%]">
								<h2 className="text-xl font-semibold mb-4">📅 My Calendar</h2>
								<CalendarWidget />
							</div>
			
						</div>

						{/* Middle Left */}
						<div className="flex flex-col gap-4 basis-1/5 min-w-[400px]">
							<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col h-[50%]">
								<EmailWidget />
							</div>
							<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col h-[50%]">
								<h2 className="text-xl font-semibold mb-4">👥 My Contacts</h2>
								<ContactWidget />
							</div>
						</div>

						{/* History */}
						<div className="flex flex-col basis-1/5 min-w-[280px] bg-[#161b22] rounded-xl p-4 shadow-lg">
							<ChatHistorySidebar onSelect={setActiveSessionId} />
						</div>
						{/* Chat Assistant */}
						<div className="flex flex-col basis-2/5 min-w-[400px] bg-[#161b22] rounded-xl p-4 shadow-lg">
							<h2 className="text-xl font-semibold mb-4">🤖 Assistant</h2>
							<ChatBox activeSessionId={activeSessionId} />
						</div>
					</div>
				</div>
			</ContactProvider>
		</CalendarProvider>
	);
}
