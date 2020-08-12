import React, { useContext } from 'react'
import { RedirectContext } from "../../App";

import { FaPen } from "react-icons/fa";
import { MdClose, MdCheck, MdAdd } from "react-icons/md";
import { IoIosTrash } from "react-icons/io";

import { IconBaseProps } from "react-icons/lib";
import { redactorOptions, roles } from "../../types"

type Props = {
    include: redactorOptions[] | redactorOptions
    props?: {[key: string]: IconBaseProps & iconSpecialProps} | IconBaseProps & iconSpecialProps
    withRoleControl?: boolean
    allowOnlyAdmin?: boolean
} & IconBaseProps;

export type iconSpecialProps = {
    allowOnlyAdmin?: boolean
    allowOnlyRedactor?: boolean
    renderIf?: () => boolean
}

const OptionsElements = {
    [redactorOptions.delete]: IoIosTrash,
    [redactorOptions.change]: FaPen,
    [redactorOptions.confirm]: MdCheck,
    [redactorOptions.reject]: MdClose,
    [redactorOptions.add]: MdAdd
}

const isSoloIconProps = (
    props: {[key: string]: IconBaseProps & iconSpecialProps} | IconBaseProps & iconSpecialProps
): props is IconBaseProps & iconSpecialProps => {
    const options = Object.values(redactorOptions);
    const keys = Object.keys(props);

    let flag = true;

    for(const opt of options) {
        if (keys.includes(opt)) flag = false;
    }

    return flag;
}

const Options: React.FC<Props> = ({ 
    include, props = {}, withRoleControl = false, 
    allowOnlyAdmin = false, ...iconProps }) => 
{
    if (isSoloIconProps(props) && typeof include === 'string') props = {[include]: props};
    if (typeof include === "string") include = [include];

    const {role = roles.student} = useContext(RedirectContext); 
 
    if (withRoleControl && role !== roles.admin && (allowOnlyAdmin || role !== roles.contributor)) {
        return null
    }

    return (
        <>
            {include.map((e, i) => {
                if (isSoloIconProps(props)) {
                    throw new Error("If you pass props for one icon you must pass string of icon, not an array")
                }

                const {allowOnlyAdmin, allowOnlyRedactor, renderIf, ...restProps} = props[e];
                if (
                    (allowOnlyRedactor && ![roles.admin, roles.contributor].includes(role)) || 
                    (allowOnlyAdmin && role !== roles.admin) ||
                     renderIf && !renderIf()
                ) return null;
                return React.createElement(OptionsElements[e], {...iconProps, ...restProps, key: i})
            }
            )}
        </>
    )
}

export default Options