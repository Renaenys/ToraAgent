'use client';
import { createContext, useContext, useState } from 'react';

const ShoppingContext = createContext();

export function ShoppingProvider({ children }) {
	const [refreshKey, setRefreshKey] = useState(0);
	const triggerRefresh = () => setRefreshKey((k) => k + 1);

	return (
		<ShoppingContext.Provider value={{ refreshKey, triggerRefresh }}>
			{children}
		</ShoppingContext.Provider>
	);
}

export function useShoppingContext() {
	return useContext(ShoppingContext);
}
