'use client';

import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useSession } from 'next-auth/react';
import './calendarDark.css';
import { FiTrash2 } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCalendarContext } from '@/context/CalendarContext';
import ToastProvider from './ToastProvider';

export default function CalendarWidget() {
	const { data: session, status } = useSession();
	const [events, setEvents] = useState([]);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [loading, setLoading] = useState(true);
	const { refreshCount } = useCalendarContext();

	const eventsByDate = events.reduce((map, event) => {
		const date = event.start.dateTime || event.start.date;
		const day = date.split('T')[0];
		map[day] = map[day] || [];
		map[day].push(event);
		return map;
	}, {});

	useEffect(() => {
		if (status === 'authenticated') {
			fetch('/api/calendar/list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: session.user.email }),
			})
				.then(async (res) => {
					if (!res.ok) {
						const errorText = await res.text();
						console.error('❌ Calendar list error:', errorText);
						throw new Error('Failed to fetch calendar');
					}
					return res.json();
				})
				.then((data) => {
					setEvents(data.events || []);
					setLoading(false);
				})
				.catch((err) => {
					console.error('❌ Calendar fetch error:', err.message);
					setLoading(false);
				});
		}
	}, [status, refreshCount]); // ✅ now includes refreshCount

	const tileClassName = ({ date }) => {
		const key = date.toISOString().split('T')[0];
		return eventsByDate[key] ? 'has-event' : '';
	};

	const displayDate = selectedDate.toLocaleDateString('en-CA');
	const dailyEvents = eventsByDate[displayDate] || [];

	const confirmDelete = (eventId) => {
		const id = toast.info(
			<div>
				<p className="font-semibold text-white">Delete this event?</p>
				<div className="mt-2 flex justify-end space-x-2">
					<button
						onClick={() => {
							toast.dismiss(id);
							handleDeleteEvent(eventId);
						}}
						className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-sm"
					>
						Yes
					</button>
					<button
						onClick={() => toast.dismiss(id)}
						className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
					>
						No
					</button>
				</div>
			</div>,
			{
				position: 'bottom-right',
				autoClose: false,
				closeOnClick: false,
				closeButton: false,
			}
		);
	};

	const handleDeleteEvent = async (eventId) => {
		const toastId = toast.loading('toastId  event...');

		const res = await fetch('/api/calendar/delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: session.user.email,
				eventId,
			}),
		});

		if (res.ok) {
			setEvents(events.filter((e) => e.id !== eventId));
			toast.update(toastId, {
				render: '✅ Event deleted',
				type: 'success',
				isLoading: false,
				autoClose: 2000,
			});
		} else {
			toast.update(toastId, {
				render: '❌ Failed to delete event',
				type: 'error',
				isLoading: false,
				autoClose: 3000,
			});
		}
	};

	return (
		<div className="text-white h-auto">
			<ToastProvider />

			<Calendar
				onChange={setSelectedDate}
				value={selectedDate}
				tileClassName={tileClassName}
				className="rounded-xl bg-[#1f2937] text-white shadow-lg p-2"
				calendarType="gregory"
				locale="en-US"
			/>

			<div
				className="mt-4 bg-[#111827] p-4 rounded-xl shadow-md overflow-y-auto"
				style={{ maxHeight: 'calc(10 * 60px)' }}
			>
				<h3 className="text-lg font-bold mb-2">Events on {displayDate}</h3>
				{loading ? (
					<p className="text-gray-400">Loading events...</p>
				) : dailyEvents.length === 0 ? (
					<p className="text-gray-500">No events.</p>
				) : (
					<ul className="space-y-2 text-sm">
						{dailyEvents.map((event, idx) => (
							<li
								key={idx}
								className="p-2 bg-gray-800 rounded flex justify-between items-start"
							>
								<div>
									<p className="font-semibold">{event.summary}</p>
									<p className="text-gray-400 text-xs">
										{event.start.dateTime
											? new Date(event.start.dateTime).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit',
											  })
											: 'All day'}
									</p>
								</div>
								<button
									className="ml-2 text-red-400 hover:text-red-300 text-md"
									onClick={() => confirmDelete(event.id)}
									title="Delete event"
								>
									<FiTrash2 />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
