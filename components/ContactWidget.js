'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useContactContext } from '@/context/ContactContext';
import { toast, ToastContainer } from 'react-toastify';
import { FiTrash2 } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

export default function ContactWidget() {
	const { data: session, status } = useSession();
	const [contacts, setContacts] = useState([]);
	const [error, setError] = useState(null);
	const [search, setSearch] = useState('');
	const { refreshCount, triggerRefresh } = useContactContext();

	useEffect(() => {
		const fetchContacts = async () => {
			try {
				const res = await fetch('/api/contacts/list', { method: 'GET' });
				if (!res.ok) throw new Error('Failed to fetch contacts');
				const data = await res.json();
				setContacts(data.contacts || []);
			} catch (err) {
				console.error('❌ Failed to load contacts:', err.message);
				setError(err.message);
			}
		};

		if (status === 'authenticated') {
			fetchContacts();
		}
	}, [status, refreshCount]);

	const filteredContacts = contacts.filter((contact) => {
		const { name, email, phone = '' } = contact;
		const q = search.toLowerCase();
		return (
			name?.toLowerCase().includes(q) ||
			email?.toLowerCase().includes(q) ||
			phone?.toLowerCase().includes(q)
		);
	});

	const confirmDelete = (id) => {
		const confirmToast = toast.info(
			<div>
				<p className="font-medium text-white">Delete this contact?</p>
				<div className="mt-2 flex justify-end space-x-2">
					<button
						onClick={() => {
							toast.dismiss(confirmToast);
							handleDelete(id);
						}}
						className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm text-white"
					>
						Yes
					</button>
					<button
						onClick={() => toast.dismiss(confirmToast)}
						className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm text-white"
					>
						No
					</button>
				</div>
			</div>,
			{
				autoClose: false,
				closeOnClick: false,
				closeButton: false,
				position: 'bottom-right',
			}
		);
	};

	const handleDelete = async (id) => {
		const deleting = toast.loading('Deleting contact...');

		try {
			const res = await fetch('/api/contacts/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contactId: id }),
			});

			const data = await res.json();

			if (res.ok) {
				toast.update(deleting, {
					render: '✅ Contact deleted!',
					type: 'success',
					isLoading: false,
					autoClose: 2000,
				});
				triggerRefresh();
			} else {
				throw new Error(data.error || 'Delete failed');
			}
		} catch (err) {
			toast.update(deleting, {
				render: `❌ ${err.message}`,
				type: 'error',
				isLoading: false,
				autoClose: 3000,
			});
		}
	};

	return (
		<div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl p-4 shadow-lg h-full flex flex-col">
			<ToastContainer theme="dark" position="bottom-right" />
			<input
				type="text"
				placeholder="Search contacts..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				className="mb-4 p-2 rounded bg-[#0d1117] text-white border border-gray-600 placeholder-gray-400"
			/>
			{error ? (
				<p className="text-red-500">Error: {error}</p>
			) : filteredContacts.length === 0 ? (
				<p className="text-gray-400">No contacts found.</p>
			) : (
				<ul className="space-y-2 overflow-y-auto max-h-60 pr-1">
					{filteredContacts.map((contact, idx) => (
						<li
							key={contact._id || idx}
							className="p-3 bg-[#1f2937] rounded-xl shadow-sm border border-gray-700 flex justify-between items-start"
						>
							<div>
								<p className="font-medium">{contact.name}</p>
								<p className="text-sm text-gray-400">{contact.email}</p>
								{contact.phone && (
									<p className="text-sm text-gray-500">📞 {contact.phone}</p>
								)}
							</div>
							<button
								onClick={() => confirmDelete(contact._id)}
								className="ml-2 text-red-400 hover:text-red-300 text-xs"
								title="Delete contact"
							>
								<FiTrash2 size={16} />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
