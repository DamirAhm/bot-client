import React, { useState } from 'react'
import InfoSection from "../InfoSection/InfoSection"
import Suspender from "../../../Common/Suspender"
import StudentPreview from "../../Students/StudentPreview/StudentPreview"
import { MdClose } from "react-icons/md"
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { studentPreview } from "../../Students/Students"
import { Student } from "../../../../types"
import ReactDOM from "react-dom"

const modalEl = document.getElementById("chooseStudentModal");
type Props = {
    styles: { [key: string]: string }
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


const StudentsSection: React.FC<Props> = ({ styles, className }) => {
    const query = useQuery<{ students: studentPreview[] }>(GET_STUDENTS_FOR_CLASS, { variables: { className } });

    const [remove] = useMutation<{ removed: boolean }, { vkId: number }>(REMOVE_STUDENT_FROM_CLASS);

    const [modalOpened, setModalOpened] = useState(false);

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
        <InfoSection name="Users" withSearch={true} updateSearchString={() => { }} className={styles.studentsSection}>
            <Suspender {...query}>
                {(data: ({ students: Student[] })) =>
                    <div className={`${styles.students}`}>
                        <div className={styles.creator} onClick={() => setModalOpened(true)}> Add student </div>
                        {data?.students.map(e =>
                            <div className={styles.student} key={e.vkId}>
                                <StudentPreview  {...e} />
                                <MdClose onClick={() => removeStudent(e.vkId)} size={30} className={`${styles.remove} remove`} />
                            </div>
                        )}
                    </div>
                }
            </Suspender>
            {modalOpened &&
                <StudentModal closeModal={() => setModalOpened(false)} />
            }
        </InfoSection>
    )
}

const StudentModal: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
    console.log(modalEl)
    if (modalEl) {
        return ReactDOM.createPortal(<div className={"modal"} onClick={closeModal}> Modal </div>, modalEl);
    }
    return null;
}
export default StudentsSection