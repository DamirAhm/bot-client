import React, { Component, ReactElement } from 'react'

interface Props {
    loading: boolean
    data: any
    error?: any
    children: (data: any) => ReactElement
}

const Suspender: React.FC<Props> = ({ data, loading, children, error }) => {
    if (error) return <div> {JSON.stringify(error, null, 2)} </div>;
    else if (loading) return <div> loading... </div>
    else if (data && children) return children(data)
    else {
        return <div> Ошибочка </div>
    }
}

export default Suspender