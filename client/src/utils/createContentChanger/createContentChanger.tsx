import React, { useState } from 'react';
import Options from "../../components/Common/Options";
import { redactorOptions } from "../../types";

import styles from "./ContentChanger.module.css";

export type ContentSectionProps<T> = {
    title?: string,
    Header?: JSX.Element | React.ComponentType<{changeHandler: (value: T) => void, value: T}> 
    ContentComponent: React.ComponentType<{changeHandler: (value: T) => void, value: T}>,
    defaultValue?: T
}
export type contentType<T extends ContentSectionProps<any>> = T extends ContentSectionProps<infer P> ? P : never;
export type stateType<T extends {[K: string]: ContentSectionProps<any>}> = {
    [K in keyof T]: contentType<T[K]>
};

export type ContentChangerProps<T extends {[key: string]: any}> = {
    reject: () => void
    confirm: (value: T) => void
    onChange?: (value: T, changed: string) => void
    initState?: Partial<T>
    sectionClassName?: string
    titleClassName?: string
}

const createContentFiller = 
    <T extends {[K: string]: ContentSectionProps<any>}>
    (contentFillers: T): React.ComponentType<ContentChangerProps<stateType<T>>> => 
{    
    return ({
        reject, confirm, onChange, initState = {} as Partial<stateType<T>>,
        sectionClassName, titleClassName, 
    }) => {
        const stateFromDefaults: stateType<T> = Object.entries(contentFillers).reduce((acc, [key, c]) => ({...acc, [key]: c}), {} as stateType<T>);
        const [state, setState] = useState<stateType<T>>({...stateFromDefaults, initState});

        return (
            <div className={styles.contentChanger} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <Options
                        include={[redactorOptions.reject, redactorOptions.confirm]}
                        props={{
                            [redactorOptions.confirm]: {
                                onClick: () => confirm(state),
                                className: "positive",
                                allowOnlyRedactor: true
                            },
                            [redactorOptions.reject]: {
                                onClick: reject,
                                className: "negative"
                            }
                        }}
                        style={{cursor: "pointer"}}
                        size={25}
                    />
                </div>
                {Object.entries(contentFillers).map(([stateKey, {title, ContentComponent, Header}]) => (
                    <section className={`${styles.section} ${sectionClassName || ""}`} key={stateKey}>
                        {Header 
                            ? <>{typeof Header === "function"
                                ? <Header 
                                    changeHandler={(value) => {
                                        setState({...state, [stateKey]: value});
                                        onChange?.({...state, [stateKey]: value}, stateKey);
                                    }} 
                                    value={state[stateKey]}
                                />
                                : {Header}
                            }</>
                            : <>{title || ""}</>
                        }
                        <h1 className={`${styles.title} ${titleClassName || ""}`}> {title} </h1>
                        <ContentComponent 
                            changeHandler={(value) => {
                                setState({...state, [stateKey]: value});
                                onChange?.({...state, [stateKey]: value}, stateKey);
                            }} 
                            value={state[stateKey]}
                        />
                    </section>
                ))}
            </div> 
        )}
}

export default createContentFiller;