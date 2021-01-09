import { useApolloClient } from '@apollo/client';
import md5 from 'md5';
import { useEffect, useState } from 'react';
import { GET_STUDENT_BY_VK_ID } from '../components/Content/StudentPage/StudentPage';
import { User, Student, setStateProp, roles } from '../types';

const useAuth = () => {
	const ApolloClient = useApolloClient();

	const [user, setUser] = useState<User | null>(null);

	const getFullUser = async (
		vkUser: Omit<returnUserType, 'hash' | 'session'>,
	): Promise<User | null> => {
		const {
			data: { studentOne },
		} = await ApolloClient.query<{ studentOne?: Student }, { vkId: number }>({
			query: GET_STUDENT_BY_VK_ID,
			variables: {
				vkId: vkUser.uid,
			},
		});

		if (studentOne) {
			const { className = null, role, schoolName = null } = studentOne;
			return { ...vkUser, className, role, schoolName };
		} else {
			return null;
		}
	};

	const onUser = async ({ hash, session, ...user }: returnUserType) => {
		const fullUser = await getFullUser(user);

		setUser(fullUser);
		localStorage.setItem('user', JSON.stringify(user));
		localStorage.setItem('hash', hash);
	};

	const logOut = () => {
		setUser(null);
		cleanLocalStorage();
		ApolloClient.clearStore();
	};

	useEffect(() => {
		const userFromStorage = getUserFromStorage();

		if (userFromStorage !== null) {
			onUser(userFromStorage);
		}
	}, []);

	const setUserThatCanReceiveFunctions = (valueOrFn: setStateProp<User | null>) => {
		if (typeof valueOrFn === 'function') {
			setUser(valueOrFn(user));
		} else {
			setUser(valueOrFn);
		}
	};

	return [user, onUser, logOut, setUserThatCanReceiveFunctions] as const;
};

export default useAuth;

function getUserFromStorage() {
	const userItem = localStorage.getItem('user');
	const hash = localStorage.getItem('hash');

	const app_id = process.env.REACT_APP_APP_ID;
	const secret = process.env.REACT_APP_SECRET;

	if (userItem && hash) {
		const parsedUser = JSON.parse(userItem);
		if (typeof parsedUser === 'object') {
			if (
				['first_name', 'last_name', 'uid', 'photo_rec'].every((key) =>
					Object.keys(parsedUser).includes(key),
				)
			) {
				if (hash === md5(app_id + parsedUser.uid + secret)) {
					return { ...parsedUser, hash: md5(app_id + parsedUser.uid + secret) };
				}
			}
		}
	}

	cleanLocalStorage();
	return null;
}

function cleanLocalStorage() {
	console.log('CLEAN');
	localStorage.removeItem('user');
	localStorage.removeItem('hash');
}
