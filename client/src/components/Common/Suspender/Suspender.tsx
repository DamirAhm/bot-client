import React from 'react'

interface Props {
    query?: {
        loading: boolean
        data: any
        error?: Error
    }
    queries?: {
        loading: boolean
        data: any
        error?: Error
    }[]
    fallback?: JSX.Element
    children: any | ((...data: any) => any)
}

const Suspender: React.FC<Props> = ({ query, children, queries, fallback = <div> loading... </div> }) => {
    if (query) {
        queries = [query];
    }

    if (queries && queries.length) {
        if (queries.some(q => q.error)) return <div> {queries.map((q, i) => q.error && <span key={"SuspenderErrorSpan" + i}> {q.error && q.error.message}</span>)} </div>;
        if (queries.some(q => q.loading)) return fallback;
        else if (queries.every(q => q.data)) {
            if (typeof children === "function") return children(...(queries.map(q => q.data)))
            else return children
        }
    } else {
        return <div> Вы не послали запрос в Suspender </div>
    }

    return null;
}

export default Suspender