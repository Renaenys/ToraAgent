import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMarketingText(prompt) {
	const res = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'user',
				content: `You are a creative copywriter. Generate a high-converting social media post for:\n\n"${prompt}"\n\nKeep it punchy, professional, and friendly.`,
			},
		],
	});
	return res.choices[0]?.message?.content || '';
}

// 🔍 Vision: decode uploaded image and return suggested image prompt
export async function extractPromptFromImage(imageBuffer) {
	const base64 = imageBuffer.toString('base64');
	const res = await openai.chat.completions.create({
		model: 'gpt-4o',
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: 'Describe this image in one sentence suitable for image generation.',
					},
					{
						type: 'image_url',
						image_url: { url: `data:image/png;base64,${base64}` },
					},
				],
			},
		],
	});
	return res.choices[0]?.message?.content || '';
}
