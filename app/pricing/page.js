'use client';

import { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';

const plans = [
	{
		id: 'basic',
		name: 'Basic Plan',
		monthly: 10,
		features: ['Up to 100 emails/month', 'AI Reply Generator', 'Calendar Sync'],
	},
	{
		id: 'pro',
		name: 'Pro Plan',
		monthly: 25,
		features: ['Unlimited emails', 'AI Reply + Scheduling', 'Priority Support'],
	},
];

export default function PricingPage() {
	const [isAnnual, setIsAnnual] = useState(false);

	const calculatePrice = (monthly) => {
		const yearly = monthly * 12;
		const discounted = (yearly * 0.85).toFixed(2); // 15% off
		return { yearly, discounted };
	};

	return (
		<div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center px-4">
			<div className="w-full max-w-5xl text-center">
				<h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
				<p className="text-gray-400 mb-6">Upgrade to unlock full features</p>

				{/* Toggle */}
				<div className="mb-8 flex items-center justify-center space-x-2">
					<span
						className={isAnnual ? 'text-gray-500' : 'text-white font-medium'}
					>
						Monthly
					</span>
					<label className="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							className="sr-only peer"
							checked={isAnnual}
							onChange={() => setIsAnnual(!isAnnual)}
						/>
						<div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition-all" />
						<span className="absolute left-1 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
					</label>
					<span
						className={!isAnnual ? 'text-gray-500' : 'text-white font-medium'}
					>
						Yearly <span className="text-green-400 text-sm">(15% off)</span>
					</span>
				</div>

				{/* Plans */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{plans.map((plan) => {
						const { yearly, discounted } = calculatePrice(plan.monthly);
						const displayPrice = isAnnual
							? `$${discounted} / yr`
							: `$${plan.monthly} / mo`;
						const originalPrice = isAnnual ? `$${yearly}` : null;

						return (
							<div
								key={plan.id}
								className="bg-[#161b22] rounded-xl p-6 border border-gray-700 shadow-md flex flex-col items-center"
							>
								<h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

								<div className="text-3xl font-semibold mb-1">
									{displayPrice}
								</div>
								{originalPrice && (
									<div className="text-sm text-gray-400 line-through mb-3">
										{originalPrice}
									</div>
								)}

								<ul className="text-left text-sm mb-6 w-full max-w-xs space-y-2">
									{plan.features.map((f, i) => (
										<li key={i} className="flex items-center">
											<FiCheckCircle className="text-green-500 mr-2 w-4 h-4" />
											<span>{f}</span>
										</li>
									))}
								</ul>

								<button className="mt-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition">
									Choose Plan
								</button>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
