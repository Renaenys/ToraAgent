// context/CalendarContext.js
'use client';
import { createContext, useContext, useState } from 'react';

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
	const [refreshCount, setRefreshCount] = useState(0);

	const triggerRefresh = () => setRefreshCount((prev) => prev + 1);

	return (
		<CalendarContext.Provider value={{ refreshCount, triggerRefresh }}>
			{children}
		</CalendarContext.Provider>
	);
};

export const useCalendarContext = () => useContext(CalendarContext);
