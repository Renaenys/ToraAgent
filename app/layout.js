'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<meta
					name="description"
					content="Tora AI Assistant: Smart calendar, chat, email & contacts"
				/>
				<meta name="theme-color" content="#0f172a" />
				<link rel="icon" href="/favicon.ico" />
				<title>Tora AI Assistant</title>
			</head>
			<body className="bg-gray-50 text-gray-900 antialiased">
				<SessionProvider>{children}</SessionProvider>
			</body>
		</html>
	);
}
