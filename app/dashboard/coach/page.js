'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ToraCoachForm from '@/components/ToraCoachForm';
import ToraCoachSummary from '@/components/ToraCoachSummary';
import ToraCoach21DayMission from '@/components/ToraCoach21DayMission';
import ToraCoachChatBox from '@/components/ToraCoachChatBox';
import DashboardLayout from '@/components/DashboardLayout';

export default function CoachPage() {
	const [profile, setProfile] = useState(null);
	const [output, setOutput] = useState('');
	const [userId, setUserId] = useState('');
	const [loading, setLoading] = useState(true);
	const { data: session, status } = useSession();
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

	useEffect(() => {
		const storedUser = localStorage.getItem('userId') || 'demo-user-123';
		setUserId(storedUser);

		const fetchProfile = async () => {
			const res = await fetch(`/api/tora-coach/profile?userId=${storedUser}`);
			const data = await res.json();
			if (data && data.identity) {
				setProfile(data);
				const session = await fetch(
					`/api/tora-coach/session?userId=${storedUser}`
				);
				const sessions = await session.json();
				if (sessions.length > 0) setOutput(sessions[0].output);
			}
			setLoading(false);
		};

		fetchProfile();
	}, []);

	const handleReset = async () => {
		if (!confirm('Are you sure you want to reset all your coach data?')) return;

		await Promise.all([
			fetch(`/api/tora-coach/profile?userId=${userId}`, { method: 'DELETE' }),
			fetch(`/api/tora-coach/chat?userId=${userId}`, { method: 'DELETE' }),
			fetch(`/api/tora-coach/session?userId=${userId}`, { method: 'DELETE' }),
			fetch(`/api/tora-coach/progress-missions?userId=${userId}`, {
				method: 'DELETE',
			}),
			fetch(
				`/api/tora-coach/missions?userId=${userId}&date=${new Date()
					.toISOString()
					.slice(0, 10)}`,
				{ method: 'DELETE' }
			),
		]);

		setProfile(null);
		setOutput('');
	};

	if (loading) {
		return (
			<div className="text-white p-8 flex items-center justify-center h-[60vh]">
				<div className="animate-pulse text-lg">Loading Tora Coach...</div>
			</div>
		);
	}

	return (
		<DashboardLayout user={user}>
			<div className="w-full min-h-screen bg-[#0d1117] text-white p-4 md:p-6 space-y-6">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold">🧠 Tora Coach Mode</h1>
					{profile && (
						<button
							onClick={handleReset}
							className="bg-red-600 hover:bg-red-700 px-4 py-2 text-sm rounded font-semibold flex items-center gap-1"
						>
							🔄 Reset Everything
						</button>
					)}
				</div>

				{!profile ? (
					<div className="max-w-3xl mx-auto">
						<ToraCoachForm
							userId={userId}
							onComplete={(result, newProfile) => {
								setOutput(result);
								setProfile(newProfile);
							}}
						/>
					</div>
				) : (
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
						<div className="space-y-6">
							<div className="bg-[#161b22] p-6 rounded-xl shadow-lg border border-gray-700">
								<ToraCoachSummary output={output} />
							</div>
							<div className="bg-[#161b22] p-6 rounded-xl shadow-lg border border-gray-700">
								<ToraCoach21DayMission userId={userId} />
							</div>
						</div>

						<div className="bg-[#161b22] p-6 rounded-xl shadow-lg border border-gray-700">
							<ToraCoachChatBox userId={userId} />
						</div>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
