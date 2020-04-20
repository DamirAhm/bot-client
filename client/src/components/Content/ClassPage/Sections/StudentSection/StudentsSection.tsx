import React, { useState, useEffect } from 'react'
import InfoSection from "../../InfoSection/InfoSection"
import Suspender from '../../../../Common/Suspender';
import StudentPreview from "../../../Students/StudentPreview/StudentPreview"
import { MdClose } from "react-icons/md"
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { studentPreview } from '../../../Students/Students';
import { Student, WithTypename } from '../../../../../types';
import ReactDOM from "react-dom"
import useList from "../../../../../hooks/useList";
import { changeHandler } from '../../../StudentPage/StudentInfo/Changer';
import styles from "./StudentSection.module.css";

const modalEl = document.getElementById("chooseStudentModal");
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
const ADD_STUDENT_TO_CLASS = gql`
    fragment StudentPreview on Student {
        vkId
        className
        banned
        role
        fullName
        __typename
    }
    mutation AddStudentToClass($vkId: Int!, $className: String!) {
        student: changeClass(vkId: $vkId, newClassName: $className) {
            ...StudentPreview
        }
    }
`

const StudentsSection: React.FC<Props> = ({ className }) => {
    const { data, loading, error } = useQuery<{ students: studentPreview[] }>(GET_STUDENTS_FOR_CLASS, { variables: { className } });

    const [remove] = useMutation<{ removed: boolean }, { vkId: number }>(REMOVE_STUDENT_FROM_CLASS);
    const [changeClass] = useMutation<WithTypename<{ student: WithTypename<studentPreview> }>, { vkId: number, className: string }>(ADD_STUDENT_TO_CLASS)

    const [modalOpened, setModalOpened] = useState(false);
    const { items, setFilter, setItems } = useList<studentPreview>([]);

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
    const addToClass = (student: studentPreview) => {
        changeClass({
            variables: { vkId: student.vkId, className },
            optimisticResponse: {
                __typename: "Mutation",
                student: {
                    __typename: "Student",
                    ...student
                }
            },
            update: (proxy, result) => {
                const data = proxy.readQuery<{ students: studentPreview[] }>
                    ({
                        query: GET_STUDENTS_FOR_CLASS,
                        variables: {
                            className
                        }
                    });

                if (data?.students && result.data?.student) {
                    proxy.writeQuery({
                        query: GET_STUDENTS_FOR_CLASS,
                        variables: { className },
                        data: {
                            students: data.students.concat([result.data.student])
                        }
                    })
                }
            }
        })
    }

    useEffect(() => {
        if (data?.students) setItems(data?.students)
    }, [data?.students])

    const changeHandler = (str: string) => {
        str = str.toLowerCase();
        setFilter(st => st.fullName.toLowerCase().search(str) !== -1 || st.role.toLocaleLowerCase().search(str) !== -1)
    }

    return (
        <InfoSection name="Ученики" updateSearchString={changeHandler} className={styles.studentsSection}>
            {str => <>
                <Suspender query={{ data: items, loading, error }}>
                    {(data: Student[]) =>
                        <div className={`${styles.students}`}>
                            <div className={styles.creator} onClick={() => setModalOpened(true)}> Добавить ученика </div>
                            {data.map(e =>
                                <div className={styles.student} key={e.vkId}>
                                    <StudentPreview searchText={str}  {...e} />
                                    <MdClose onClick={() => removeStudent(e.vkId)} size={30} className={`${styles.remove} remove`} />
                                </div>
                            )}
                        </div>
                    }
                </Suspender>
                {modalOpened &&
                    <StudentModal className={className} styles={styles} addStudent={addToClass} closeModal={() => setModalOpened(false)} />
                }</>
            }
        </InfoSection>
    )
}

const GET_STUDENTS_FOR_CHOOSING = gql`
    fragment StudentPreview on Student {
        vkId
        className
        role,
        banned,
        fullName
    }
    {
        students: studentMany {
            ...StudentPreview
        }
    }
`

type StudentModalProps = {
    closeModal: () => void,
    addStudent: (student: studentPreview) => void,
    styles: { [key: string]: string },
    className: string
}


const StudentModal: React.FC<StudentModalProps> = ({ closeModal, addStudent, styles, className }) => {
    const query = useQuery<{ students: studentPreview[] }>(GET_STUDENTS_FOR_CHOOSING);

    if (modalEl) {
        return ReactDOM.createPortal(
            <div className={"modal"} onClick={closeModal}>
                <div className={styles.chooseStudent} onClick={e => (e.stopPropagation())}>
                    <span className={styles.title}> Выберите ученика которого необходимо добавить </span>
                    <Suspender query={query}>
                        {(data: { students: studentPreview[] }) =>
                            <div className={styles.studentsChooser}>
                                <div key={"-1"} className={styles.chooser}>
                                    <span className={styles.chooser_name}>Имя</span>
                                    <span className={styles.chooser_vkId}>vkId</span>
                                    <span className={styles.chooser_className}>Класс</span>
                                </div>
                                {data.students
                                    .filter((student: studentPreview) => student.className !== className)
                                    .map((student: studentPreview) =>
                                        <div key={student.vkId} className={styles.chooser} onClick={() => (addStudent(student), closeModal())}>
                                            <span className={styles.chooser_name}>{student.fullName}</span>
                                            <span className={styles.chooser_vkId}>{student.vkId}</span>
                                            <span className={styles.chooser_className}>{student.className}</span>
                                        </div>
                                    )
                                }
                            </div>
                        }
                    </Suspender>
                </div>
            </div>,
            modalEl);
    }
    return null;
}
export default StudentsSection