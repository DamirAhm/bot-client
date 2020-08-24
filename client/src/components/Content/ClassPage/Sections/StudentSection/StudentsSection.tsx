import React, { useState, useEffect } from 'react'
import InfoSection from "../../InfoSection/InfoSection"
import Suspender from '../../../../Common/Suspender/Suspender';
import StudentPreview from "../../../Students/StudentPreview/StudentPreview"
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { sort, studentPreview } from '../../../Students/Students';
import { redactorOptions, roles, Student, WithTypename } from '../../../../../types';
import ReactDOM from "react-dom"
import useList from "../../../../../hooks/useList";
import styles from "./StudentSection.module.css";
import Options from "../../../../Common/Options/Options";
import { UserContext } from "../../../../../App";
import { useContext } from "react";
import Filters from "../../../../Filters/Filters";
import { highlightSearch } from "../../../../../utils/functions";

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
        role
        fullName
        _id
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
        role
        fullName
        _id
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
    const [changeClass] = useMutation<WithTypename<{
        student: WithTypename<studentPreview>
    }>, {
        vkId: number,
        className: string
    }>(ADD_STUDENT_TO_CLASS)

    const [modalOpened, setModalOpened] = useState(false);
    const [searchString, setSearchString] = useState("");

    const { items, setFilter, setItems } = useList<studentPreview>([]);
    const { role } = useContext(UserContext);

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

                const resData = result.data;

                if (resData !== undefined && resData !== null) {
                    if (data?.students && result.data?.student) {
                        proxy.writeQuery({
                            query: GET_STUDENTS_FOR_CLASS,
                            variables: { className },
                            data: {
                                students: data.students.concat([result.data.student])
                            }
                        })
                        proxy.writeQuery({
                            query: GET_STUDENTS_FOR_CLASS,
                            variables: { className: student.className },
                            data: {
                                students: data.students.filter(({ _id }) => _id !== resData.student._id)
                            }
                        })
                    }
                }
            }
        })
    }

    useEffect(() => {
        if (data?.students) setItems(data?.students)
    }, [data, setItems])

    const changeHandler = (str: string) => {
        str = str.toLowerCase();
        setSearchString(str);
        setFilter(st => st.fullName.toLowerCase().search(str) !== -1 || st.role.toLocaleLowerCase().search(str) !== -1)
    }

    return (
        <InfoSection name="Ученики" defaultSearchString={searchString} updateSearchString={changeHandler} className={styles.studentsSection}>
            <>
                <Suspender query={{ data: items, loading, error }}>
                    {(data: Student[]) =>
                        <div className={`${styles.students}`}>
                            {(role === roles.contributor || role === roles.admin) &&
                                <div className={styles.creator} onClick={() => setModalOpened(true)}> Добавить ученика </div>
                            }
                            {data.map(e =>
                                <div className={styles.student} key={e.vkId}>
                                    <StudentPreview visibleInfo={["fullName", "vkId"]} searchText={searchString}  {...e} />
                                    <Options
                                        include={redactorOptions.reject}
                                        props={{
                                            onClick: () => removeStudent(e.vkId),
                                            size: 30,
                                            className: `${styles.remove} remove`,
                                            allowOnlyRedactor: true
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    }
                </Suspender>
                {modalOpened &&
                    <StudentModal className={className} styles={styles} addStudent={addToClass} closeModal={() => setModalOpened(false)} />
                }</>
        </InfoSection>
    )
}

const GET_STUDENTS_FOR_CHOOSING = gql`
    fragment StudentPreview on Student {
        vkId
        className
        role
        fullName
        _id
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
    const sorts: sort[] = [
        {
            name: "Имени",
            sort: (a: studentPreview, b: studentPreview) => (a.fullName > b.fullName ? 1 : -1)
        },
        {
            name: "Vk id",
            sort: (a: studentPreview, b: studentPreview) => (a.vkId - b.vkId)
        },
        {
            name: "Имени класса",
            sort: (a: studentPreview, b: studentPreview) => {
                if (a.className.toLowerCase() === "нету") return -1;
                if (b.className.toLowerCase() === "нету") return 1;
                return (a.className > b.className ? 1 : -1)
            }
        }
    ];

    const query = useQuery<{ students: studentPreview[] }>(GET_STUDENTS_FOR_CHOOSING);
    const [searchText, setText] = useState("");
    const { items, setFilter, setSort, setItems } = useList<studentPreview>(
        [], (student: studentPreview) => student.className !== className, sorts[2].sort);

    const setSearchText = (str: string) => {
        str = str.toLowerCase();
        setText(str);
        setFilter(
            (c: studentPreview) =>
                c.fullName
                    .toLowerCase()
                    .search(str) !== -1 ||
                c.vkId
                    .toString()
                    .search(str) !== -1 ||
                c.className
                    .toLowerCase()
                    .search(str) !== -1,
            (student: studentPreview) => student.className !== className
        );
    };

    const setSorting = (name: string) => {
        const sort = sorts.find(sort => sort.name === name)?.sort;
        if (sort) {
            setSort(sort);
        } else {
            setSort(() => 1);
        }
    };

    useEffect(() => {
        if (query.data?.students)
            setItems(query.data.students)
    }, [query, setItems]);

    if (modalEl) {
        return ReactDOM.createPortal(
            <div className={"modal"} onClick={closeModal}>
                <div className={styles.chooseStudent} onClick={e => (e.stopPropagation())}>
                    <span className={styles.title}> Выберите ученика которого необходимо добавить </span>
                    <Suspender query={query}>
                        <div className={styles.studentsChooser}>
                            <Filters
                                className={styles.filters}
                                setSearchText={setSearchText}
                                sortsList={sorts}
                                setSort={setSorting}
                            />
                            <div className={styles.chooser}>
                                <span className={styles.chooser_name}>Имя</span>
                                <span className={styles.chooser_vkId}>vkId</span>
                                <span className={styles.chooser_className}>Класс</span>
                            </div>
                            {items
                                .map((student: studentPreview) =>
                                    <StudentPicker
                                        onClick={() => { addStudent(student); closeModal() }}
                                        key={student.vkId}
                                        student={student}
                                        searchText={searchText}
                                    />
                                )
                            }
                        </div>
                    </Suspender>
                </div>
            </div>,
            modalEl);
    }
    return null;
}

const StudentPicker: React.FC<{
    student: studentPreview,
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
    searchText: string
}> = ({ student, onClick, searchText }) => {
    const highlighter = (str: string | number) => {
        return highlightSearch(str.toString(), searchText);
    };

    return (
        <div
            key={student.vkId}
            className={styles.chooser}
            onClick={onClick}
        >
            <span className={styles.chooser_name}>{highlighter(student.fullName)}</span>
            <span className={styles.chooser_vkId}>{highlighter(student.vkId)}</span>
            <span className={styles.chooser_className}>{highlighter(student.className)}</span>
        </div>
    )
}

export default React.memo(StudentsSection)