import React, { Component, ReactElement } from 'react'

interface Props {
    query?: {
        loading: boolean
        data: any
        error?: any
    }
    queries?: {
        loading: boolean
        data: any
        error?: any
    }[]
    children: (...data: any) => ReactElement | null
}

const Suspender: React.FC<Props> = ({ query, children, queries }) => {
    if (queries) {
        if (queries.some(q => q.error)) return <div> {queries.map((q, i) => <span key={"SuspenderErrorSpan" + i}> {q.error && JSON.stringify(q.error, null, 2)} <br /></span>)} </div>;
        if (queries.some(q => q.loading)) return <div> loading... </div>;
        else if (queries.every(q => q.data)) return children(...(queries.map(q => q.data)))
    } else if (query) {
        const { error, loading, data } = query;
        if (error) return <div> {JSON.stringify(error, null, 2)} </div>;
        else if (loading) return <div> loading... </div>
        else if (data && children) return children(data)
    }
    else {
        return <div> Ошибочка </div>
    }
    return null;
}

export default Suspender