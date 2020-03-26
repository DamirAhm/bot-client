import React from "react";
import styles from "./Sidebar.module.css";
import {NavLink} from "react-router-dom";

const Sidebar: React.FC = () => {
    return (
        <div className={styles.sidebar}>
            <NavLink to="/classes" className={styles.link} activeClassName={styles.active}> Классы </NavLink>
            <NavLink to="/students" className={styles.link} activeClassName={styles.active}> Ученики </NavLink>
        </div>
    )
};

export default Sidebar;