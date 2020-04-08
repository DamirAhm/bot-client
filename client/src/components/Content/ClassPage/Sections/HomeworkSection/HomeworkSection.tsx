import React from 'react'
import styles from './HomeworkSection.module.css'
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery } from '@apollo/react-hooks';
import { homework } from '../../../../../types';
import Suspender from '../../../../Common/Suspender';

type Props = {
    className: string
}

const GET_HOMEWORK = gql`
    query GetHomework($className: String!) {
        homework: getHomework(className: $className)
    }
`

const HomeworkSection: React.FC<Props> = ({ className }) => {
    const homeworkQuery = useQuery<{ homework: homework[] }>(GET_HOMEWORK);

    return (
        <InfoSection name='Домашняя работа'>
            <Suspender query={homeworkQuery}>
                {(data: { homework: homework[] }) =>
                    <>{data.homework.map(({ task }, i) => <div key={`hw${task}`}>{task}</div>)}</>
                }
            </Suspender>
        </InfoSection>
    )
}

export default HomeworkSection