import React from 'react'
import {
    Draggable,
    DraggableProps,
    Droppable,
    DroppableProps,
} from "react-beautiful-dnd";

//? Props are half distructured to not cross with drag/drop components

export const DraggableEntity: React.FC<
    Omit<DraggableProps, "children"> & { children: JSX.Element } & React.HTMLAttributes<HTMLDivElement>
> = ({
    children,
    draggableId,
    index,
    isDragDisabled,
    disableInteractiveElementBlocking,
    shouldRespectForcePress,
    ...props
}) => {
        return (
            <Draggable {...{
                children,
                draggableId,
                index,
                isDragDisabled,
                disableInteractiveElementBlocking,
                shouldRespectForcePress
            }}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        {...props}
                    >
                        {children}
                    </div>
                )}
            </Draggable>
        )
    }

export const DroppableEntity: React.FC<
    Omit<DroppableProps, "children"> & { children: JSX.Element } & React.HTMLAttributes<HTMLDivElement>
> = ({
    children,
    droppableId,
    isDropDisabled,
    direction,
    getContainerForClone,
    ignoreContainerClipping,
    isCombineEnabled,
    mode,
    renderClone,
    type,
    ...props
}) => {
        return (
            <Droppable {...{
                children,
                droppableId,
                isDropDisabled,
                direction,
                getContainerForClone,
                ignoreContainerClipping,
                isCombineEnabled,
                mode,
                renderClone,
                type,
            }}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        {...props}
                    >
                        {children}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        )
    }

