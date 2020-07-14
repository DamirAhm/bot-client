import React from "react";
import styles from "./Sidebar.module.css";
import { NavLink } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaChevronLeft } from "react-icons/fa";
const Sidebar: React.FC = () => {
    return (
        <div onMouseDown={e => e.stopPropagation()} className={styles.sidebar}>
            <input type="checkbox" id={styles.check} />
            <label htmlFor={styles.check}>
                <FaChevronLeft className={styles.opened} size={20} />
                <GiHamburgerMenu className={styles.closed} size={20}/>
            </label>
            <NavLink to="/classes" className={styles.link} activeClassName={styles.active}> Классы </NavLink>
            <NavLink to="/students" className={styles.link} activeClassName={styles.active}> Ученики </NavLink>
        </div>
    )
};
export default Sidebar;