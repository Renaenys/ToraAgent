'use client';

import { createContext, useContext, useState } from 'react';

const ContactContext = createContext();

export function ContactProvider({ children }) {
	const [refreshCount, setRefreshCount] = useState(0);

	const triggerRefresh = () => setRefreshCount((prev) => prev + 1);

	return (
		<ContactContext.Provider value={{ refreshCount, triggerRefresh }}>
			{children}
		</ContactContext.Provider>
	);
}

export const useContactContext = () => useContext(ContactContext);
