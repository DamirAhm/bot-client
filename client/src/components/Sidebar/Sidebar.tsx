// <reference path="../../global.d.ts" />
// @ts-check

import React from 'react';
import styles from './Sidebar.module.css';
import { NavLink } from 'react-router-dom';
import { GiHamburgerMenu } from 'react-icons/gi';
import { FaChevronLeft } from 'react-icons/fa';
import { roles, User } from '../../types';
import { UserContext } from '../../App';
import { useContext } from 'react';

const UserInfo: React.FC<{
	userInfo: Pick<User, 'photo_rec' | 'first_name' | 'last_name'>;
	logOut: () => void;
}> = ({ userInfo: { first_name, last_name, photo_rec }, logOut }) => {
	return (
		<div className={styles.userInfo}>
			<img src={'https://vk.com' + photo_rec} alt="Фото пользователя" />
			<span className={styles.userName}>
				{first_name} {last_name}
			</span>
			<button className={styles.logOut} onClick={logOut}>
				{' '}
				Выйти{' '}
			</button>
		</div>
	);
};

const Sidebar: React.FC<{ logOut: () => void }> = ({ logOut }) => {
	const { first_name, last_name, photo_rec, role, className, uid, schoolName } = useContext(
		UserContext,
	);

	const userInfo = { first_name, last_name, photo_rec };

	return (
		<div onMouseDown={(e) => e.stopPropagation()} className={styles.sidebar}>
			<input type="checkbox" id={styles.check} />
			<label htmlFor={styles.check}>
				<FaChevronLeft className={styles.opened} size={20} />
				<GiHamburgerMenu className={styles.closed} size={20} />
			</label>

			{role === roles.admin ? (
				<>
					<NavLink
						to={`/${schoolName}/classes`}
						className={styles.link}
						activeClassName={styles.active}
						isActive={(_, location) => location.pathname.indexOf('/classes') !== -1}
					>
						Классы
					</NavLink>
					<NavLink
						to={`/students`}
						className={styles.link}
						activeClassName={styles.active}
					>
						Ученики
					</NavLink>
				</>
			) : (
				<>
					<NavLink
						to={`${schoolName}/classes/${className}`}
						className={styles.link}
						activeClassName={styles.active}
					>
						Класс
					</NavLink>
					<NavLink
						to={`/students/${uid}`}
						className={styles.link}
						activeClassName={styles.active}
					>
						Ученик
					</NavLink>
				</>
			)}
			{first_name && last_name && photo_rec && (
				<NavLink to={`/students/${uid}`} className={styles.userInfo}>
					<UserInfo userInfo={userInfo} logOut={logOut} />
				</NavLink>
			)}
		</div>
	);
};
export default Sidebar;
