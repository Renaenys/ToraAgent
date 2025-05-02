'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiCheckSquare, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useShoppingContext } from '@/context/ShoppingContext';

export default function ShoppingListWidget() {
	const { data: session } = useSession();
	const { refreshKey } = useShoppingContext(); // ✅ listen for refresh signal
	const [items, setItems] = useState([]);
	const [newItem, setNewItem] = useState('');

	const fetchItems = async () => {
		if (!session?.user?.email) return;
		const res = await fetch('/api/shopping?email=' + session.user.email);
		const data = await res.json();
		setItems(data.items || []);
	};

	useEffect(() => {
		fetchItems(); // ✅ re-run when context says to refresh
	}, [session, refreshKey]);

	const handleAdd = async () => {
		if (!newItem.trim()) return;

		// Check for duplicates
		const duplicate = items.some(
			(i) => i.item?.toLowerCase().trim() === newItem.toLowerCase().trim()
		);
		if (duplicate) {
			toast.warn('🛑 Item already exists!');
			return;
		}

		const res = await fetch('/api/shopping', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: session.user.email,
				items: [{ name: newItem, done: false }], // ✅ same format as AI
			}),
		});
		const data = await res.json();
		if (Array.isArray(data.items)) {
			setItems((prev) => [...data.items, ...prev]);
		}
		setNewItem('');
	};

	const handleToggle = async (id, done) => {
		const res = await fetch('/api/shopping/' + id, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ done: !done }),
		});
		const data = await res.json();
		setItems((prev) => prev.map((i) => (i._id === id ? data.item : i)));
	};

	const handleDelete = async (id) => {
		const res = await fetch('/api/shopping/' + id, { method: 'DELETE' });
		if (res.ok) {
			toast.success('Deleted');
			setItems((prev) => prev.filter((i) => i._id !== id));
		} else {
			toast.error('Failed to delete');
		}
	};

	return (
		<div className="bg-[#161b22] rounded-xl p-4 shadow text-white">
			<h2 className="text-xl font-semibold mb-4">🛒 Shopping List</h2>
			<div className="flex gap-2 mb-4">
				<input
					className="flex-1 bg-gray-800 p-2 rounded text-white"
					placeholder="Add item..."
					value={newItem}
					onChange={(e) => setNewItem(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
				/>
				<button
					className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
					onClick={handleAdd}
				>
					Add
				</button>
			</div>
			<ul className="space-y-2 max-h-60 overflow-y-auto">
				{Array.isArray(items) &&
					items.filter(Boolean).map((item) => (
						<li
							key={item._id}
							className="flex justify-between items-center bg-gray-800 p-2 rounded"
						>
							<span className={item?.done ? 'line-through text-gray-400' : ''}>
								{item?.item || 'Unnamed'}
							</span>
							<div className="flex items-center gap-2">
								<button onClick={() => handleToggle(item._id, item.done)}>
									<FiCheckSquare />
								</button>
								<button
									className="text-red-400 hover:text-red-300"
									onClick={() => handleDelete(item._id)}
								>
									<FiTrash2 />
								</button>
							</div>
						</li>
					))}
			</ul>
		</div>
	);
}
