import { useEffect } from 'react';

type callback = () => void;

const useUnmount = (cb: callback | callback[]) => {
	useEffect(() => {
		if (!Array.isArray(cb)) {
			return cb;
		} else {
			return () => {
				cb.forEach((callback) => callback());
			};
		}
	}, []);
};

export default useUnmount;
