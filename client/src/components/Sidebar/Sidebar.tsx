import React from "react";
import styles from "./Sidebar.module.css";
import {NavLink} from "react-router-dom";
import {GiHamburgerMenu} from "react-icons/gi";
import {FaChevronLeft} from "react-icons/fa";
const Sidebar: React.FC = () => {
    return (
        <div onClick={e => e.stopPropagation()} className={styles.sidebar}>
            <label htmlFor={styles.check}>
                {document.querySelector(`#${styles.check}:checked`) ?
                    <FaChevronLeft size={20}/> :
                    <GiHamburgerMenu size={20} className={styles.hamb}/>
                }
            </label>
            <input onChange={() => document.querySelector(`.wrapper`)?.classList.toggle("sidebarOpened")} type="checkbox" id={styles.check}/>
            <NavLink to="/classes" className={styles.link} activeClassName={styles.active}> Классы </NavLink>
            <NavLink to="/students" className={styles.link} activeClassName={styles.active}> Ученики </NavLink>
        </div>
    )
};

export default Sidebar;