import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze a crypto chart image using GPT-4o Vision
 * @param {Buffer} imageBuffer - The image buffer of the chart
 * @returns {Promise<string>} - The structured Smart Money Concept analysis
 */
export async function analyzeChartImage(imageBuffer) {
	if (!imageBuffer) throw new Error('Missing image buffer');

	const base64 = imageBuffer.toString('base64');

	const visionPrompt = [
		{
			role: 'user',
			content: [
				{
					type: 'text',
					text: `
You're a financial analyst trained to analyze ONLY chart images. The image is a crypto candlestick chart with indicators like RSI, MACD, and Volume.

⚠️ Important:
- Do NOT assume there are people, faces, or objects.
- This is not a photo or real-world image — it's a financial chart.
- Focus ONLY on interpreting price structure, trends, levels, and indicators.

✅ Return exactly this structured format:
- Trend: Bullish / Bearish
- Entry: (suggested entry price)
- TP: (take profit)
- SL: (stop loss)
- BOS: (break of structure insight)
- FVG: (fair value gap insight)
- Support/Resistance: key zones
- SMC Insight: ideal trade idea based on SMC

If chart is unclear, still provide your best guess. Do NOT ask user for description.
          `,
				},
				{
					type: 'image_url',
					image_url: {
						url: `data:image/png;base64,${base64}`,
					},
				},
			],
		},
	];

	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4o',
			messages: visionPrompt,
			temperature: 0.3,
		});

		const result = response.choices[0]?.message?.content;
		return result || '⚠️ No analysis returned.';
	} catch (error) {
		console.error('❌ GPT Vision Error:', error.message);
		return '⚠️ AI analysis failed.';
	}
}
