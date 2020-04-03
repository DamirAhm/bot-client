import React from 'react'
import styles from './ClassPage.module.css'
import { IoIosTrash } from "react-icons/io";
import InfoSection from './InfoSection/InfoSection';
import { useQuery } from '@apollo/react-hooks';
import { Student } from '../../../types';
import { GET_STUDENTS } from '../Students/Students';
import Suspender from '../../Common/Suspender';

type Props = {
    className: string
}

const ClassPage: React.FC<Props> = ({ className }) => {
    const query = useQuery<{ students: Student[] }>(GET_STUDENTS);

    return (
        <div className={styles.class}>
            <div className={styles.header}>
                <div className={styles.name}> {className} </div>
                <IoIosTrash size={30} className="remove" />
            </div>
            <InfoSection name="Users" withSearch={true} updateSearchString={() => { }} propsStyles={{ maxHeight: "300px" }}>
                <Suspender {...query}>
                    {(data: ({ students: Student[] })) =>
                        <div>
                            {data?.students?.map(e => <div>{e.vkId}</div>)}
                        </div>
                    }
                </Suspender>
            </InfoSection>
        </div>
    )
}

export default ClassPage