'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	FiMenu,
	FiGrid,
	FiBarChart2,
	FiChevronLeft,
	FiUserCheck,
} from 'react-icons/fi';
import { BiSolidMegaphone } from 'react-icons/bi';

const navItems = [
	{
		href: '/dashboard/basic',
		label: 'Basic Tools',
		icon: <FiGrid size={18} />,
	},
	{
		href: '/dashboard/business',
		label: 'Business Tools',
		icon: <FiBarChart2 size={18} />,
	},
	{
		href: '/dashboard/marketing',
		label: 'Marketing Tools',
		icon: <BiSolidMegaphone size={18} />,
	},
	{
		href: '/dashboard/coach',
		label: 'Coach Tools',
		icon: <FiUserCheck size={18} />,
	},
];

export default function DashboardLayout({ children }) {
	const [collapsed, setCollapsed] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 1024);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const toggleSidebar = () => setCollapsed((prev) => !prev);

	return (
		<div className="relative flex min-h-screen bg-gradient-to-br from-[#0d1117] to-[#1a1f2e] text-white overflow-hidden">
			<div
				className={`z-40 bg-[#161b22]/60 backdrop-blur-md min-h-screen shadow-xl fixed lg:static transition-all duration-300 ${
					isMobile
						? collapsed
							? 'left-0 w-52'
							: '-left-64 w-52'
						: collapsed
						? 'w-14'
						: 'w-52'
				}`}
			>
				<div className="flex items-center justify-between p-4">
					{!collapsed || isMobile ? (
						<span className="font-bold text-white text-base">🧠 Tools</span>
					) : null}
					<button
						className="text-white hover:text-gray-400"
						onClick={toggleSidebar}
					>
						<FiChevronLeft
							size={20}
							className={`${isMobile ? 'block' : 'hidden'} lg:hidden`}
						/>
					</button>
				</div>
				<nav className="flex flex-col gap-1 px-2">
					{navItems.map((item) => (
						<Link key={item.href} href={item.href}>
							<div
								className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors duration-200 ${
									pathname === item.href
										? 'bg-green-600 text-white'
										: 'hover:bg-[#1f242c] text-gray-300'
								}`}
								onClick={() => isMobile && setCollapsed(false)}
							>
								<div className="min-w-[20px] flex justify-center">
									{item.icon}
								</div>
								<span
									className={`${
										collapsed && !isMobile ? 'hidden' : 'truncate'
									}`}
								>
									{item.label}
								</span>
							</div>
						</Link>
					))}
				</nav>
			</div>

			<div className="flex flex-col flex-1 min-h-screen z-10">
				<div className="px-4 py-3 flex items-center justify-between bg-[#0d1117]/80 border-b border-gray-800 shadow-sm backdrop-blur">
					<button
						className="text-white hover:text-gray-400"
						onClick={toggleSidebar}
					>
						<FiMenu size={22} />
					</button>
				</div>
				<main className="flex-1 overflow-y-auto p-4 w-full">{children}</main>
			</div>
		</div>
	);
}
