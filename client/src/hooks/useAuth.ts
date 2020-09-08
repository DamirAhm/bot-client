import { useApolloClient } from "@apollo/react-hooks";
import md5 from "md5";
import { useEffect, useState } from "react";
import { GET_STUDENT } from "../components/Content/StudentPage/StudentPage";
import { User, Student } from "../types";

const useAuth = () => {
    const ApolloClient = useApolloClient();

    const [user, setUser] = useState<User | null>(null
        // process.env.NODE_ENV === "production"
        //     ? null
        //     : JSON.parse(process.env.REACT_APP_USER || "null") as User
    );

    const onUser = async ({ hash, session, ...user }: returnUserType) => {
        const { data: { studentOne } } = await ApolloClient.query<
            { studentOne?: Student },
            { filter: Partial<Student> }
        >({
            query: GET_STUDENT,
            variables: {
                filter: {
                    vkId: user.uid
                }
            }
        });

        if (studentOne) {
            const { role, className } = studentOne;

            const userWithRole: User = { ...user, role, className }
            setUser(userWithRole);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("hash", hash)
        }
    }
    const logOut = () => {
        setUser(null);
        cleanStorage()
    }

    useEffect(() => {
        if (!user) {
            let userSetted = false;

            const userItem = localStorage.getItem("user");
            const hash = localStorage.getItem("hash");

            const app_id = process.env.REACT_APP_APP_ID;
            const secret = process.env.REACT_APP_SECRET;
            if (userItem && hash) {
                const parsedUser = JSON.parse(userItem);
                if (typeof parsedUser === "object") {
                    if (["first_name", "last_name", "uid", "photo_rec"].every(key => Object.keys(parsedUser).includes(key))) {
                        console.log(md5(app_id + parsedUser.uid + secret))
                        if (hash === md5(app_id + parsedUser.uid + secret)) {
                            userSetted = true;
                            setUser(parsedUser);
                        }
                    }
                }
            }

            if (!userSetted) {
                cleanStorage();
            }
        }
    }, [user]);

    return [user, onUser, logOut, setUser] as const;
}

export default useAuth;

function cleanStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("hash");
}
