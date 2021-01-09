import { QueryResult } from '@apollo/client';
import { useEffect } from 'react';

const usePolling = (
	query: QueryResult | QueryResult[],
	interval: number | number[] = 2000,
): void => {
	const queries = Array.isArray(query) ? query : [query];

	useEffect(() => {
		if (process.env.NODE_ENV === 'production') {
			for (let i = 0; i < queries.length; i++) {
				queries[i].startPolling(Array.isArray(interval) ? interval[i] : interval);
			}
		}
	}, []);
};

export default usePolling;
