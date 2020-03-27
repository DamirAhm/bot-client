import React, {useState} from "react";
import styles from "./Sidebar.module.css";
import {NavLink} from "react-router-dom";
import {GiHamburgerMenu} from "react-icons/gi";
import {FaChevronLeft} from "react-icons/fa";
import {useQuery, useMutation} from "@apollo/react-hooks";
import {gql} from "apollo-boost";
import {SIDEBAR_OPENED} from "../../index";
import {TOGGLE_SIDEBAR} from "../../App";

const Sidebar: React.FC = () => {
    const {data} = useQuery<{ sidebarOpened: boolean }>(SIDEBAR_OPENED);
    const [toggleSidebar] = useMutation<{ toggleSidebar: boolean }, {flag: boolean}>(TOGGLE_SIDEBAR, {variables: {flag: !data?.sidebarOpened}});
    const handleCheck = () => {
        toggleSidebar();
    };
    return (
        <div onClick={e => e.stopPropagation()} className={`${styles.sidebar} ${data?.sidebarOpened && "opened"}`}>
            <label onBlur={handleCheck} htmlFor={styles.check}>
                {data?.sidebarOpened ?
                    <FaChevronLeft size={20}/> :
                    <GiHamburgerMenu size={20} className={styles.hamb}/>
                }
            </label>
            <input onChange={handleCheck} checked={!!data?.sidebarOpened} type="checkbox" id={styles.check}/>
            <NavLink to="/classes" className={styles.link} activeClassName={styles.active}> Классы </NavLink>
            <NavLink to="/students" className={styles.link} activeClassName={styles.active}> Ученики </NavLink>
        </div>
    )
};

export default Sidebar;