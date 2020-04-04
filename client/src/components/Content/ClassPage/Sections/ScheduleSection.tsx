import React from 'react'
import { gql } from 'apollo-boost';
type Props = {
    className: string
}

const GET_SCHEDULE = gql`
    {
        
    }
`

const ScheduleSection: React.FC<Props> = ({ className }) => {
    return (
        <div> schedule </div>
    )
}

export default ScheduleSection