import React from 'react'
import styles from './ClassPage.module.css'
import { IoIosTrash } from "react-icons/io";
import InfoSection from './InfoSection/InfoSection';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Student } from '../../../types';
import { GET_STUDENTS, studentPreview } from '../Students/Students';
import Suspender from '../../Common/Suspender';
import StudentPreview from "../Students/StudentPreview/StudentPreview";
import { gql } from 'apollo-boost';
import { MdClose } from "react-icons/md";

type Props = {
    className: string
}

const REMOVE_STUDENT_FROM_CLASS = gql`
    mutation RemoveStudentFromClass($vkId: Int!) {
        removed: removeStudentFromClass(vkId: $vkId)
    }
`
const GET_STUDENTS_FOR_CLASS = gql`
    fragment StudentPreview on Student {
        vkId
        className
        role,
        banned,
        fullName
    }
    query GetStudents($className: String!){
        students: studentsForClass(className: $className) {
            ...StudentPreview
        }
    }
`

const ClassPage: React.FC<Props> = ({ className }) => {
    const query = useQuery<{ students: studentPreview[] }>(GET_STUDENTS_FOR_CLASS, { variables: { className } });

    const [remove] = useMutation<{ removed: boolean }, { vkId: number }>(REMOVE_STUDENT_FROM_CLASS);

    const removeStudent = (vkId: number) => {
        remove({
            variables: { vkId: vkId },
            optimisticResponse: {
                removed: true
            },
            update: (proxy, result) => {
                const data = proxy.readQuery<{ students: studentPreview[] }>({ query: GET_STUDENTS_FOR_CLASS, variables: { className } });
                console.log(data, result)
                if (data?.students && result.data?.removed) {
                    proxy.writeQuery({
                        query: GET_STUDENTS_FOR_CLASS,
                        variables: { className },
                        data: {
                            students: data?.students.filter(e => e.vkId !== vkId)
                        }
                    })
                }
            }
        })
    }

    return (
        <div className={styles.class}>
            <div className={styles.header}>
                <div className={styles.name}> {className} </div>
                <IoIosTrash size={30} className="remove" />
            </div>
            <InfoSection name="Users" withSearch={true} updateSearchString={() => { }} className={styles.studentsSection}>
                <Suspender {...query}>
                    {(data: ({ students: Student[] })) =>
                        <div className={`${styles.students}`}>
                            {data?.students.map(e =>
                                <div className={styles.student} key={e.vkId}>
                                    <StudentPreview  {...e} />
                                    <MdClose onClick={() => removeStudent(e.vkId)} size={30} className={`${styles.remove} remove`} />
                                </div>
                            )}
                        </div>
                    }
                </Suspender>
            </InfoSection>
        </div>
    )
}

export default ClassPage