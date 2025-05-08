'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import ToraCoachForm from '@/components/ToraCoachForm';
import ToraCoachSummary from '@/components/ToraCoachSummary';
import ToraCoach21DayMission from '@/components/ToraCoach21DayMission';
import ToraCoachChatBox from '@/components/ToraCoachChatBox';
import DashboardLayout from '@/components/DashboardLayout';

export default function CoachPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [user, setUser] = useState(null);
	const [userId, setUserId] = useState('');
	const [profile, setProfile] = useState(null);
	const [output, setOutput] = useState('');
	const [loading, setLoading] = useState(true);
	const [authChecked, setAuthChecked] = useState(false);

	// Step 1: Check auth & VIP2 membership
	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/login');
			return;
		}

		if (status === 'authenticated') {
			const checkMembership = async () => {
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
						setAuthChecked(true);
					}
				} catch (err) {
					console.error('❌ Membership check failed:', err);
					router.push('/pricing');
				}
			};
			checkMembership();
		}
	}, [session, status]);

	// Step 2: Get userId from /api/user/me
	useEffect(() => {
		if (!authChecked) return;

		const getUserId = async () => {
			try {
				const res = await fetch('/api/user/me');
				const data = await res.json();
				if (data?.user?._id) {
					localStorage.setItem('userId', data.user._id);
					setUserId(data.user._id);
				}
			} catch (err) {
				console.error('❌ Failed to fetch userId:', err);
			}
		};

		getUserId();
	}, [authChecked]);

	// Step 3: Load profile + session output after userId is set
	useEffect(() => {
		if (!userId) return;

		const fetchProfile = async () => {
			try {
				const res = await fetch(`/api/tora-coach/profile?userId=${userId}`);
				const data = await res.json();
				if (data?.identity) {
					setProfile(data);
					const sessionRes = await fetch(
						`/api/tora-coach/session?userId=${userId}`
					);
					const sessions = await sessionRes.json();
					if (sessions.length > 0) setOutput(sessions[0].output);
				}
			} catch (err) {
				console.error('❌ Failed to fetch profile:', err);
			}
			setLoading(false);
		};

		fetchProfile();
	}, [userId]);

	// Reset all user data
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

	// Guard render
	if (!authChecked || loading || !userId) {
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
