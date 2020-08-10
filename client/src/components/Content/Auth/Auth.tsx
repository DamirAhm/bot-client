import React, { useEffect } from 'react'
import { User } from "../../../types"
import styles from './Auth.module.css'

type Props = {
    setUser: (user: User) => void
}

const Auth: React.FC<Props> = ({setUser}) => {
    useEffect(() => {
        VK.Widgets.Auth('vk_auth', { onAuth: setUser, width: 400 })
    }, []) 
     
    return (
        <div className={styles.container}>
            <h1>Авторизуйтесь с помощью вконтакте</h1>
            <div id="vk_auth"></div>
        </div>
    )
}

export default Auth;