import axios from 'axios';

export async function generateChartImage(ticker) {
	const API_KEY = process.env.CHART_IMG_API_KEY;
	if (!API_KEY) {
		console.error('❌ Missing CHART_IMG_API_KEY in environment variables.');
		throw new Error('Missing Chart-img API key.');
	}

	const formattedTicker = ticker.trim().toUpperCase();

	const config = {
		theme: 'dark',
		interval: '4h',
		symbol: `BINANCE:${formattedTicker}`,
		override: {
			showStudyLastValue: false,
		},
		studies: [
			{
				name: 'Volume',
				forceOverlay: true,
			},
			{
				name: 'MACD',
				override: {
					'Signal.linewidth': 2,
					'Signal.color': 'rgb(255,65,129)',
				},
			},
			{
				name: 'Relative Strength Index',
				override: {
					'RSI.linewidth': 2,
				},
			},
		],
	};

	try {
		console.log('📤 Sending request to Chart-img:');
		console.log(JSON.stringify(config, null, 2));

		const res = await axios.post(
			'https://api.chart-img.com/v2/tradingview/advanced-chart/storage',
			config,
			{
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
			}
		);

		const imageUrl = res.data?.url; // ✅ fixed: use res.data.url directly
		if (!imageUrl) {
			console.error('⚠️ Chart-img API returned no image URL', res.data);
			throw new Error('Chart-img API did not return image URL');
		}

		const imageRes = await axios.get(imageUrl, {
			responseType: 'arraybuffer',
		});

		return Buffer.from(imageRes.data);
	} catch (error) {
		if (error.response) {
			console.error('🔥 Chart-img API failed:');
			console.error('Status:', error.response.status);
			console.error('Data:', JSON.stringify(error.response.data, null, 2));
		} else {
			console.error('❌ Unknown error:', error.message);
		}
		throw error;
	}
}
