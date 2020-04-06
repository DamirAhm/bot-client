import React from 'react'
import { gql } from 'apollo-boost';
import InfoSection from '../../InfoSection/InfoSection';
import { useQuery } from '@apollo/react-hooks';
import Suspender from '../../../../Common/Suspender';
import styles from "./ScheduleSection.module.css";
type Props = {
    className: string,
}

const GET_SCHEDULE = gql`
    query GetSchedule($className: String!){
        schedule: getSchedule(className: $className)
    }
`

const ScheduleSection: React.FC<Props> = ({ className }) => {
    const query = useQuery<{ schedule: string[][] }>(GET_SCHEDULE, { variables: { className } });
    console.log(query)
    return (
        <InfoSection name={"Расписание"}>
            <Suspender {...query}>
                {(data: ({ schedule: string[][] })) =>
                    <div className={styles.days}>
                        {data.schedule.map((day, i) => <ScheduleDay key={"day" + i} index={i} lessons={day} />)}
                    </div>
                }
            </Suspender>
        </InfoSection>
    )
}

type ScheduleDayProps = {
    index: number,
    lessons: string[]
}

const ScheduleDay: React.FC<ScheduleDayProps> = ({ index, lessons }) => {
    return <div className={styles.day}>
        {lessons.map((lesson, i) =>
            <span key={index + lesson + i}> {lesson} </span>)
        }
    </div>
}

export default ScheduleSection;