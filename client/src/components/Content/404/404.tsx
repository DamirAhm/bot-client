import React from 'react'
import { Redirect } from "react-router-dom"
import styles from './404.module.css'

const style = {
    fontSize: "2rem",
    color: "var(--main)",
    padding: " 0 20px",
}

const Page404: React.FC = () => {
    return (
        <div style={style} className={styles.container}>
            Простите ничего не нашлось 😢😭
        </div>
    )
}

export const RedirectTo404: React.FC = () => <Redirect to="/404" />

export default Page404