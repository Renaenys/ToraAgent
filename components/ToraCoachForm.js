'use client';
import { useState } from 'react';
import clsx from 'clsx';

const steps = ['Identity', 'Goals', 'Learning', 'Self Ratings', 'Quiz'];

export default function ToraCoachForm({ userId, onComplete }) {
	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState({
		identity: { fullName: '', email: '', country: '', occupation: '' },
		goals: {
			sixMonthGoal: '',
			longTermDream: '',
			inspiration: '',
			whyChange: '',
		},
		learning: { targetSkill: '', learningStyle: '', discomfortLevel: 5 },
		selfRatings: {
			consistency: 5,
			clarity: 5,
			focus: 5,
			timeManagement: 5,
			discipline: 5,
		},
		personalityQuiz: { overwhelmedResponse: '', failureResponse: '' },
	});

	const handleChange = (section, field, value) => {
		setForm((prev) => ({
			...prev,
			[section]: { ...prev[section], [field]: value },
		}));
	};

	const handleSubmit = async () => {
		setLoading(true);
		await fetch('/api/tora-coach/profile', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, ...form }),
		});

		const planRes = await fetch('/api/tora-coach/plan', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, coachData: form }),
		});
		const planData = await planRes.json();

		const profileRes = await fetch(`/api/tora-coach/profile?userId=${userId}`);
		const profileData = await profileRes.json();

		setLoading(false);
		onComplete(planData.output, profileData);
	};

	const inputClass =
		'w-full px-4 py-2 rounded-md bg-[#0d1117] border border-gray-700 text-white focus:ring-2 focus:ring-green-600 focus:outline-none';

	return (
		<div className="space-y-6">
			<div className="flex justify-center gap-2">
				{steps.map((_, idx) => (
					<div
						key={idx}
						className={clsx(
							'w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold',
							idx === step
								? 'bg-green-600 text-white'
								: 'bg-gray-600 text-gray-300'
						)}
					>
						{idx + 1}
					</div>
				))}
			</div>

			<section className="bg-[#161b22] rounded-xl shadow border border-gray-700 p-6 space-y-5">
				<h3 className="text-xl font-bold text-white">{steps[step]}</h3>

				{step === 0 && (
					<>
						{['fullName', 'email', 'country', 'occupation'].map((field) => (
							<div key={field} className="space-y-1">
								<label className="text-sm font-medium text-gray-300 capitalize">
									{field}
								</label>
								<input
									className={inputClass}
									placeholder={`Enter your ${field}`}
									onChange={(e) =>
										handleChange('identity', field, e.target.value)
									}
								/>
							</div>
						))}
					</>
				)}

				{step === 1 && (
					<>
						{['sixMonthGoal', 'longTermDream', 'inspiration'].map((field) => (
							<div key={field} className="space-y-1">
								<label className="text-sm font-medium text-gray-300 capitalize">
									{field}
								</label>
								<input
									className={inputClass}
									placeholder={`Your ${field}`}
									onChange={(e) => handleChange('goals', field, e.target.value)}
								/>
							</div>
						))}
						<div className="space-y-1">
							<label className="text-sm font-medium text-gray-300">
								Why change your life now?
							</label>
							<textarea
								className="w-full min-h-[80px] px-4 py-2 rounded-md bg-[#0d1117] border border-gray-700 text-white resize-none focus:ring-2 focus:ring-green-600 focus:outline-none"
								onChange={(e) =>
									handleChange('goals', 'whyChange', e.target.value)
								}
							/>
						</div>
					</>
				)}

				{step === 2 && (
					<>
						<div className="space-y-1">
							<label className="text-sm font-medium text-gray-300">
								Skill to Master
							</label>
							<input
								className={inputClass}
								onChange={(e) =>
									handleChange('learning', 'targetSkill', e.target.value)
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium text-gray-300">
								Preferred Learning Style
							</label>
							<select
								className={inputClass}
								onChange={(e) =>
									handleChange('learning', 'learningStyle', e.target.value)
								}
							>
								<option value="">Choose...</option>
								<option>Reading</option>
								<option>Watching</option>
								<option>Doing</option>
								<option>Mixed</option>
							</select>
						</div>
						<div className="space-y-1">
							<label className="text-sm font-medium text-gray-300">
								Comfort with Discomfort: {form.learning.discomfortLevel}/10
							</label>
							<input
								type="range"
								min="1"
								max="10"
								className="w-full"
								value={form.learning.discomfortLevel}
								onChange={(e) =>
									handleChange('learning', 'discomfortLevel', e.target.value)
								}
							/>
						</div>
					</>
				)}

				{step === 3 && (
					<>
						{Object.entries(form.selfRatings).map(([key, value]) => (
							<div key={key} className="space-y-1">
								<label className="text-sm font-medium text-gray-300 capitalize">
									{key}
								</label>
								<input
									type="range"
									min="1"
									max="10"
									value={value}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											selfRatings: {
												...prev.selfRatings,
												[key]: e.target.value,
											},
										}))
									}
									className="w-full"
								/>
								<p className="text-sm text-gray-400">{value}/10</p>
							</div>
						))}
					</>
				)}

				{step === 4 && (
					<>
						{[
							{ key: 'overwhelmedResponse', label: 'When overwhelmed, you...' },
							{ key: 'failureResponse', label: 'After 3 failures, you...' },
						].map(({ key, label }) => (
							<div key={key} className="space-y-1">
								<label className="text-sm font-medium text-gray-300">
									{label}
								</label>
								<select
									className={inputClass}
									onChange={(e) =>
										handleChange('personalityQuiz', key, e.target.value)
									}
								>
									<option value="">Choose...</option>
									<option value="A">Pause or delay</option>
									<option value="B">Break it down and try</option>
									<option value="C">Wait until pressured</option>
									<option value="D">Push emotionally or repeat</option>
								</select>
							</div>
						))}
					</>
				)}
			</section>

			<div className="flex justify-between">
				{step > 0 && (
					<button
						onClick={() => setStep(step - 1)}
						className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
					>
						← Back
					</button>
				)}
				{step < steps.length - 1 ? (
					<button
						onClick={() => setStep(step + 1)}
						className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
					>
						Next →
					</button>
				) : (
					<button
						onClick={handleSubmit}
						disabled={loading}
						className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
					>
						{loading ? 'Submitting...' : 'Submit & Generate Plan'}
					</button>
				)}
			</div>
		</div>
	);
}
