import React, { useEffect } from 'react'
import styles from './Auth.module.css'

type Props = {
    setUser: (user: returnUserType) => void
}

const Auth: React.FC<Props> = ({ setUser }) => {
    const authRef = React.createRef<HTMLDivElement>();

    useEffect(() => {
        VK.Widgets.Auth(styles.vk_auth, { onAuth: setUser, width: 200 })
    })

    return (
        <div className={styles.container}>
            <h1>Авторизуйтесь с помощью вконтакте</h1>
            <div id={styles.vk_auth} ref={authRef}></div>
        </div>
    )
}

export default Auth;