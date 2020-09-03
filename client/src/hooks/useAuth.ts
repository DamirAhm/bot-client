import { useApolloClient } from "@apollo/react-hooks";
import md5 from "md5";
import { useEffect, useState } from "react";
import { GET_STUDENT } from "../components/Content/StudentPage/StudentPage";
import { User, roles, Student } from "../types";

const useAuth = () => {
    const ApolloClient = useApolloClient();

    const [user, setUser] = useState<User | null>(
        process.env.NODE_ENV === "production"
            ? null
            : JSON.parse(process.env.REACT_APP_USER || "null") as User ||
            {
                role: (process.env.REACT_APP_ROLE || "ADMIN") as roles,
                className: process.env.REACT_APP_CLASS_NAME || "10Б",
                first_name: process.env.REACT_APP_FIRST_NAME || "Дамир",
                last_name: process.env.REACT_APP_LAST_NAME || "Ахметзянов",
                photo: process.env.REACT_APP_PHOTO || "/images/camera_200.png?ava=1",
                photo_rec: process.env.REACT_APP_PHOTO_REC || "/images/camera_50.png?ava=1",
                uid: process.env.REACT_APP_UID || 227667805,
            }
    );

    const onUser = async ({ hash, session, ...user }: returnUserType) => {
        const { data: { student: { role, className } } } = await ApolloClient.query<
            { student: { role: roles, className: string } },
            { filter: Partial<Student> }
        >({ query: GET_STUDENT, variables: { filter: { vkId: user.uid } } });

        const userWithRole: User = { ...user, role, className }

        setUser(userWithRole);
        localStorage.setItem("user", JSON.stringify(userWithRole));
        localStorage.setItem("hash", hash)
    }
    const logOut = () => {
        setUser(null);
        localStorage.removeItem("user");
    }

    useEffect(() => {
        if (!user) {
            const userItem = localStorage.getItem("user");
            const hash = localStorage.getItem("hash");

            const app_id = process.env.REACT_APP_APP_ID;
            const secret = process.env.REACT_APP_SECRET;
            if (userItem && hash) {
                const parsedUser = JSON.parse(userItem);
                if (typeof parsedUser === "object") {
                    if (["first_name", "last_name", "uid", "photo_rec"].every(key => Object.keys(parsedUser).includes(key))) {
                        if (hash === md5(app_id + parsedUser.uid + secret)) {
                            setUser(parsedUser);
                        } else {
                            localStorage.removeItem("user");
                            localStorage.removeItem("hash");
                        }
                    } else {
                        localStorage.removeItem("user");
                        localStorage.removeItem("hash");
                    }
                } else {
                    localStorage.removeItem("user");
                    localStorage.removeItem("hash");
                }
            }
        }
    }, [user]);

    return [user, onUser, logOut] as const;
}

export default useAuth;