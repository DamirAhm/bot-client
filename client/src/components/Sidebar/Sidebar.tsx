// <reference path="../../global.d.ts" />
// @ts-check

import React from "react";
import styles from "./Sidebar.module.css";
import { NavLink } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaChevronLeft } from "react-icons/fa";
import { roles, User } from "../../types";
import { UserContext } from "../../App";
import { useContext } from "react";

const UserInfo: React.FC<
    {userInfo: Pick<User, "photo_rec" | "first_name" | "last_name">, resetUser: () => void}
> = ({userInfo: {first_name, last_name, photo_rec}, resetUser}) => {
    const logOut = () => {
        resetUser();
        localStorage.removeItem("user");
    }

    return <div className={styles.userInfo}>
        <img src={"https://vk.com" + photo_rec} alt="Фото пользователя"/>
        <span className={styles.userName}>{first_name} {last_name}</span>
        <button className={styles.logOut} onClick={logOut}> Выйти </button>
    </div>
}

const Sidebar: React.FC<{setUser: (user: User | null) => void}> = ({setUser}) => {
    const {first_name, last_name, photo_rec, role, className, uid} = useContext(UserContext);

    return (
        <div onMouseDown={e => e.stopPropagation()} className={styles.sidebar}>
            <input type="checkbox" id={styles.check} />
            <label htmlFor={styles.check}>
                <FaChevronLeft className={styles.opened} size={20} />
                <GiHamburgerMenu className={styles.closed} size={20}/>
            </label>

            {role === roles.admin 
                ? <>
                    <NavLink to="/classes" className={styles.link} activeClassName={styles.active}> Классы </NavLink>
                    <NavLink to="/students" className={styles.link} activeClassName={styles.active}> Ученики </NavLink>
                </>
                : <>
                    <NavLink to={`/classes/${className}`} className={styles.link} activeClassName={styles.active}> Класс </NavLink>
                    <NavLink to={`/students/${uid}`} className={styles.link} activeClassName={styles.active}> Ученик </NavLink>
                </>    
            }
            {first_name && last_name && photo_rec &&
                <UserInfo userInfo={{first_name, last_name, photo_rec}} resetUser={() => setUser(null)}/>
            }
        </div>
    )
};
export default Sidebar;