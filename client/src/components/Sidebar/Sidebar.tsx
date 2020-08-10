// <reference path="../../global.d.ts" />
// @ts-check

import React from "react";
import styles from "./Sidebar.module.css";
import { NavLink } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaChevronLeft } from "react-icons/fa";
import { User } from "../../types";

const UserInfo: React.FC<{user: User, resetUser: () => void}> = ({user, resetUser}) => {
    const logOut = () => {
        resetUser();
        localStorage.removeItem("user");
    }

    return <div className={styles.userInfo}>
        <img src={"https://vk.com" + user.photo_rec} alt="Фото пользователя"/>
        <span className={styles.userName}>{user.first_name} {user.last_name}</span>
        <button className={styles.logOut} onClick={logOut}> Выйти </button>
    </div>
}

const Sidebar: React.FC<{user: User | null, setUser: (user: User | null) => void}> = ({user, setUser}) => {
    return (
        <div onMouseDown={e => e.stopPropagation()} className={styles.sidebar}>
            <input type="checkbox" id={styles.check} />
            <label htmlFor={styles.check}>
                <FaChevronLeft className={styles.opened} size={20} />
                <GiHamburgerMenu className={styles.closed} size={20}/>
            </label>
            <NavLink to="/classes" className={styles.link} activeClassName={styles.active}> Классы </NavLink>
            <NavLink to="/students" className={styles.link} activeClassName={styles.active}> Ученики </NavLink>

            {user &&
                <UserInfo user={user} resetUser={() => setUser(null)}/>
            }
        </div>
    )
};
export default Sidebar;