import styles from '../Common/ContentSection.module.css';
import { attachment, WithTypename, homework, redactorOptions } from '../../../../../types';

import React, { useContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { gql, useSubscription } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client';
import { GoTriangleRight } from 'react-icons/go';
import { useParams } from 'react-router-dom';

import {
	parseContentByDate,
	objectForEach,
	getDateStrFromDayMonthStr,
	getPinnedContent,
	concatObjects,
} from '../../../../../utils/functions';

import Options from '../../../../Common/Options/Options';
import ChangeHomework from '../../../../Common/ChangeContent/ChangeHomework';
import ContentElement from '../../../../Common/ContentElement';
import Accordion from '../../../../Common/Accordion/Accordion';
import Suspender from '../../../../Common/Suspender/Suspender';
import InfoSection from '../../InfoSection/InfoSection';

import usePolling from '../../../../../hooks/usePolling';
import { UserContext } from '../../../../../App';

const changeContentModalRoot = document.getElementById('changeContentModal');

const Queries = {
	GET_HOMEWORK: gql`
		query GetHomework($className: String!, $schoolName: String!) {
			homework: getHomework(className: $className, schoolName: $schoolName) {
				text
				createdBy
				to
				attachments {
					url
					value
					_id
				}
				lesson
				pinned
				_id
				__typename
			}
		}
	`,
};
const Mutations = {
	REMOVE_TASK: gql`
		mutation RemoveTask($className: String!, $homeworkId: String!, $schoolName: String!) {
			removeHomework(homeworkId: $homeworkId, className: $className, schoolName: $schoolName)
		}
	`,
	CHANGE_HOMEWORK: gql`
		mutation ChangeHomework(
			$className: String!
			$homeworkId: String!
			$updates: ClassHomeworkInput!
			$schoolName: String!
		) {
			updateHomework(
				className: $className
				homeworkId: $homeworkId
				updates: $updates
				schoolName: $schoolName
			) {
				_id
				text
				attachments {
					url
					value
					_id
				}
				to
				lesson
				pinned
				__typename
			}
		}
	`,
	ADD_HOMEWORK: gql`
		mutation addHomework(
			$schoolName: String!
			$className: String!
			$text: String!
			$to: String
			$lesson: String!
			$attachments: [ClassHomeworkAttachmentsInput]!
			$student_id: Int!
		) {
			addHomework(
				className: $className
				text: $text
				to: $to
				lesson: $lesson
				attachments: $attachments
				student_id: $student_id
				schoolName: $schoolName
			) {
				_id
				text
				lesson
				to
				pinned
				attachments {
					url
					value
				}
				__typename
			}
		}
	`,
	REMOVE_OLD_HOMEWORK: gql`
		mutation RemoveOldHomework($className: String!, $schoolName: String!) {
			removeOldHomework(className: $className, schoolName: $schoolName) {
				_id
				to
				text
				attachments {
					url
					value
					_id
				}
				lesson
				createdBy
				__typename
			}
		}
	`,
	TOGGLE_PIN_HOMEWORK: gql`
		mutation TogglePinHomework(
			$className: String!
			$schoolName: String!
			$homeworkId: String!
		) {
			pinHomework(className: $className, schoolName: $schoolName, homeworkId: $homeworkId) {
				_id
				pinned
			}
		}
	`,
	UNPIN_ALL_HOMEWORK: gql`
		mutation UnpinAllHomework($className: String!, $schoolName: String!) {
			unpinAllHomework(className: $className, schoolName: $schoolName)
		}
	`,
};
const Subscriptions = {
	ON_HOMEWORK_ADDED: gql`
		subscription OnHomeworkAdded($className: String!, $schoolName: String!) {
			onHomeworkAdded(className: $className, schoolName: $schoolName) {
				_id
				text
				lesson
				attachments {
					url
					value
					_id
				}
				to
				pinned
				__typename
			}
		}
	`,
	ON_HOMEWORK_CONFIRMED: gql`
		subscription OnHomeworkConfirmed($className: String!, $schoolName: String!) {
			onHomeworkConfirmed(className: $className, schoolName: $schoolName) {
				stabId
				actualId
			}
		}
	`,
	ON_HOMEWORKS_REMOVED: gql`
		subscription OnHomeworksRemoved($className: String!, $schoolName: String!) {
			onHomeworksRemoved(className: $className, schoolName: $schoolName)
		}
	`,
	ON_HOMEWORK_CHANGED: gql`
		subscription OnHomeworkChanged($className: String!, $schoolName: String!) {
			onHomeworkChanged(className: $className, schoolName: $schoolName) {
				_id
				text
				lesson
				attachments {
					url
					value
					_id
				}
				to
				pinned
				__typename
			}
		}
	`,
};

const HomeworkSection: React.FC<{}> = ({}) => {
	const { schoolName, className } = useParams<{ schoolName: string; className: string }>();
	const { uid } = useContext(UserContext);
	const [homeworkCreating, setHomeworkCreating] = useState(false);
	const [initContent, setInitContent] = useState({});

	const homeworkQuery = useQuery<
		{ homework: homework[] },
		{ className: string; schoolName: string }
	>(Queries.GET_HOMEWORK, {
		variables: { className, schoolName },
	});
	useSubscription<{ onHomeworkAdded: homework | null }>(Subscriptions.ON_HOMEWORK_ADDED, {
		variables: { className, schoolName },
		onSubscriptionData: ({ subscriptionData }) => {
			console.log(subscriptionData);
			const newHomework = subscriptionData.data?.onHomeworkAdded;
			if (newHomework) {
				homeworkQuery.updateQuery((prev) => {
					return {
						homework: prev.homework.concat([newHomework]),
					};
				});
			}
		},
	});
	useSubscription<{ onHomeworkConfirmed: { stabId: string; actualId: string } | null }>(
		Subscriptions.ON_HOMEWORK_CONFIRMED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const confirmation = subscriptionData.data?.onHomeworkConfirmed;

				if (confirmation) {
					homeworkQuery.updateQuery((prev) => {
						return {
							homework: prev.homework.map(({ _id, ...homework }) =>
								_id === confirmation.stabId
									? { _id: confirmation.actualId, ...homework }
									: { _id, ...homework },
							),
						};
					});
				}
			},
		},
	);
	useSubscription<{ onHomeworksRemoved: string[] | null }>(Subscriptions.ON_HOMEWORKS_REMOVED, {
		variables: { className, schoolName },
		onSubscriptionData: ({ subscriptionData }) => {
			const removedHomeworksIds = subscriptionData.data?.onHomeworksRemoved;

			if (removedHomeworksIds) {
				homeworkQuery.updateQuery((prev) => {
					return {
						homework: prev.homework.filter(
							({ _id }) => !removedHomeworksIds.includes(_id as string),
						),
					};
				});
			}
		},
	});
	useSubscription<{ onHomeworkChanged: Partial<homework> | null }>(
		Subscriptions.ON_HOMEWORK_CHANGED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const updates = subscriptionData.data?.onHomeworkChanged;

				if (updates) {
					homeworkQuery.updateQuery((prev) => {
						return {
							homework: prev.homework.map(({ _id, ...homework }) =>
								_id === updates._id
									? { ...homework, ...updates }
									: { ...homework, _id },
							),
						};
					});
				}
			},
		},
	);

	const [addHomework] = useMutation<
		WithTypename<{
			addHomework: WithTypename<homework>;
		}>,
		{
			className: string;
			schoolName: string;
			text: string;
			lesson: string;
			attachments: attachment[];
			to: string;
			student_id: number;
		}
	>(Mutations.ADD_HOMEWORK);
	const [removeOldHomework] = useMutation<
		{ removeOldHomework: homework[] },
		{ className: string; schoolName: string }
	>(Mutations.REMOVE_OLD_HOMEWORK, {
		variables: { className, schoolName },
		optimisticResponse: {
			removeOldHomework:
				homeworkQuery.data?.homework.filter(
					({ to }) => Date.now() - Date.parse(to) <= 24 * 60 * 60 * 1000,
				) || [],
		},
		update: (proxy, mutation) => {
			if (mutation && mutation.data?.removeOldHomework) {
				proxy.writeQuery({
					query: Queries.GET_HOMEWORK,
					variables: { className, schoolName },
					data: {
						homework: mutation.data.removeOldHomework,
					},
				});
			}
		},
	});

	const add = (homeworkData: Pick<homework, 'text' | 'attachments' | 'lesson' | 'to'>) => {
		addHomework({
			variables: {
				...homeworkData,
				className,
				schoolName,
				attachments: homeworkData.attachments.map(({ __typename, ...att }) => att),
				student_id: uid,
			},
			optimisticResponse: {
				__typename: 'Mutation',
				addHomework: {
					...homeworkData,
					pinned: false,
					_id: Date.now().toString(),
					__typename: 'ClassHomework',
				},
			},
			refetchQueries: [
				{
					query: Queries.GET_HOMEWORK,
					variables: { className, schoolName },
				},
			],
		});
		setInitContent({});
	};

	return (
		<>
			<InfoSection
				isOpened={
					!!(homeworkQuery?.data?.homework && homeworkQuery?.data?.homework.length > 0)
				}
				name="Домашняя работа"
				Header={({ opened, onClick }) => (
					<div
						className={`${styles.sectionHeader} ${styles.contentHeader}`}
						onClick={onClick}
					>
						<div className={styles.title}>
							Домашняя работа
							<GoTriangleRight
								className={opened ? styles.triangle_opened : ''}
								size={15}
							/>
						</div>
						<Add
							onClick={(e) => {
								e.stopPropagation();
								setHomeworkCreating(true);
							}}
						/>
					</div>
				)}
			>
				<Suspender query={homeworkQuery}>
					{(data: { homework: homework[] }) => {
						const [oldHw, newHw] = parseContentByDate(data.homework);
						const pinnedHw = concatObjects(
							parseContentByDate(getPinnedContent(data.homework)),
						);

						return (
							<div className={styles.content}>
								{Object.keys(pinnedHw).length > 0 && (
									<Accordion
										accordionId="pinnedHomework"
										initiallyOpened={false}
										Head={({ opened }) => (
											<div className={styles.oldContentHeader}>
												<p className={`${styles.date} ${styles.accordion}`}>
													Закрепленное дз
													<GoTriangleRight
														size={15}
														className={
															opened ? styles.triangle_opened : ''
														}
													/>
												</p>

												<Options
													include={redactorOptions.delete}
													props={{
														allowOnlyRedactor: true,
														className: `remove ${styles.removeOldContent}`,
														size: 20,
														onClick: () => removeOldHomework(),
													}}
												/>
											</div>
										)}
									>
										<div className={styles.offseted}>
											<HomeworkLayout
												homework={pinnedHw}
												initiallyOpened={false}
												setHomeworkCreating={setHomeworkCreating}
												setInitContent={setInitContent}
											/>
										</div>
									</Accordion>
								)}
								{Object.keys(oldHw).length > 0 && (
									<Accordion
										accordionId="oldHomework"
										initiallyOpened={false}
										Head={({ opened }) => (
											<div className={styles.oldContentHeader}>
												<p className={`${styles.date} ${styles.accordion}`}>
													Старое дз
													<GoTriangleRight
														size={15}
														className={
															opened ? styles.triangle_opened : ''
														}
													/>
												</p>

												<Options
													include={redactorOptions.delete}
													props={{
														allowOnlyRedactor: true,
														className: `remove ${styles.removeOldContent}`,
														size: 20,
														onClick: () => removeOldHomework(),
													}}
												/>
											</div>
										)}
									>
										<div className={styles.offseted}>
											<HomeworkLayout
												homework={oldHw}
												initiallyOpened={false}
												setHomeworkCreating={setHomeworkCreating}
												setInitContent={setInitContent}
											/>
										</div>
									</Accordion>
								)}
								<HomeworkLayout
									homework={newHw}
									setHomeworkCreating={setHomeworkCreating}
									setInitContent={setInitContent}
								/>
							</div>
						);
					}}
				</Suspender>
			</InfoSection>
			{changeContentModalRoot &&
				homeworkCreating &&
				ReactDOM.createPortal(
					<CreateHomeworkModal
						returnHomework={add}
						close={() => {
							setHomeworkCreating(false);
							setInitContent({});
						}}
						initContent={initContent}
					/>,
					changeContentModalRoot,
				)}
		</>
	);
};

const HomeworkLayout: React.FC<{
	homework: {
		[day: string]: homework[];
	};
	initiallyOpened?: boolean;
	setHomeworkCreating: (state: boolean) => void;
	setInitContent: (initContent: Partial<homework>) => void;
}> = React.memo(({ homework, setHomeworkCreating, setInitContent, initiallyOpened = true }) => {
	const [changingId, setChangingId] = useState<string | null>(null);
	const changingHomework = changingId ? findHomeworkById(changingId) : null;
	const { schoolName, className } = useParams<{ schoolName: string; className: string }>();

	const [removeHomework] = useMutation<
		WithTypename<{
			removeHomework: string;
		}>,
		{
			className: string;
			homeworkId: string;
			schoolName: string;
		}
	>(Mutations.REMOVE_TASK);
	const remove = (homeworkId: string | undefined) => {
		if (homeworkId) {
			removeHomework({
				variables: { className, homeworkId, schoolName },
				optimisticResponse: {
					__typename: 'Mutation',
					removeHomework: homeworkId,
				},
				update: (proxy, res) => {
					const data = proxy.readQuery<{ homework: homework[] }>({
						query: Queries.GET_HOMEWORK,
						variables: { className, schoolName },
					});

					if (res?.data) {
						proxy.writeQuery({
							query: Queries.GET_HOMEWORK,
							variables: { className, schoolName },
							data: {
								homework:
									data?.homework.filter((hw) => hw._id !== homeworkId) || [],
							},
						});
					}
				},
			});
		}
	};

	const [updateHomework] = useMutation<
		WithTypename<{
			updateHomework: WithTypename<Partial<homework>>;
		}>,
		{
			className: string;
			schoolName: string;
			homeworkId: string;
			updates: Partial<Omit<homework, 'attachments'> & { attachments: attachment[] }>;
		}
	>(Mutations.CHANGE_HOMEWORK);
	const update = (homeworkId: string | undefined, updates: Partial<WithTypename<homework>>) => {
		const { __typename, ...updatesWithoutTypename } = updates;

		if (homeworkId) {
			updateHomework({
				variables: {
					className,
					schoolName,
					homeworkId,
					updates: {
						...updatesWithoutTypename,
						attachments: updates.attachments?.map(({ __typename, ...att }) => att),
					},
				},
				optimisticResponse: {
					__typename: 'Mutation',
					updateHomework: {
						__typename: 'ClassHomework',
						_id: homeworkId,
						...Object.values(homework)
							.flat()
							.find((hw) => hw._id === homeworkId),
						...updates,
					},
				},
				update: (proxy, res) => {
					const data = proxy.readQuery<{ homework: homework[] }>({
						query: Queries.GET_HOMEWORK,
						variables: { className, schoolName },
					});

					if (res?.data) {
						proxy.writeQuery({
							query: Queries.GET_HOMEWORK,
							variables: { className, schoolName },
							data: {
								homework:
									data?.homework.map((hw) =>
										hw._id === homeworkId ? res.data?.updateHomework : hw,
									) || [],
							},
						});
					}
				},
			});
		}
	};

	const [pinHomework] = useMutation<
		{ pinHomework: { _id: string; pinned: boolean } },
		{ schoolName: string; className: string; homeworkId: string }
	>(Mutations.TOGGLE_PIN_HOMEWORK);
	const pin = (homeworkId: string) => {
		const hw = Object.values(homework)
			.flat()
			.find((hw) => hw._id === homeworkId);

		if (hw) {
			pinHomework({
				optimisticResponse: {
					pinHomework: {
						_id: homeworkId,
						pinned: !hw.pinned,
					},
				},
				variables: {
					className,
					schoolName,
					homeworkId,
				},
			});
		}
	};

	const [unpinAll] = useMutation<
		{ unpinAllHomework: boolean },
		{ className: string; schoolName: string }
	>(Mutations.UNPIN_ALL_HOMEWORK, {
		variables: {
			className,
			schoolName,
		},
	});

	useEffect(() => {
		if (changingHomework === null && changingId !== null) {
			setChangingId(null);
		}
	}, [changingHomework]);

	function findHomeworkById(id: string) {
		const homeworkArray = Object.values(homework).flat();

		return homeworkArray.find((homework) => homework._id === id) || null;
	}

	const parsedHomework = objectForEach(homework, parseHomeworkByLesson);

	return (
		<>
			{Object.keys(parsedHomework).map((hwDate) => (
				<Accordion
					accordionId={`homework${hwDate}`}
					key={hwDate}
					initiallyOpened={initiallyOpened}
					Head={({ opened }) => (
						<div className={styles.sectionHeader}>
							<div className={`${styles.date} ${styles.accordion}`}>
								{hwDate}
								<GoTriangleRight
									className={opened ? styles.triangle_opened : ''}
									size={15}
								/>
							</div>
							<Add
								onClick={(e) => {
									e.stopPropagation();
									setHomeworkCreating(true);
									setInitContent({ to: getDateStrFromDayMonthStr(hwDate) });
								}}
							/>
						</div>
					)}
				>
					<>
						{Object.keys(parsedHomework[hwDate]).map((lesson) => (
							<Accordion
								accordionId={`homework${hwDate}${lesson}`}
								className={styles.offseted}
								key={hwDate + lesson}
								Head={({ opened }) => (
									<div className={styles.sectionHeader}>
										<div className={`${styles.lesson} ${styles.accordion}`}>
											{lesson}
											<GoTriangleRight
												className={opened ? styles.triangle_opened : ''}
												size={15}
											/>
										</div>
										<Add
											onClick={(e) => {
												e.stopPropagation();
												setHomeworkCreating(true);
												setInitContent({
													to: getDateStrFromDayMonthStr(hwDate),
													lesson,
												});
											}}
										/>
									</div>
								)}
							>
								<div className={`${styles.elements} ${styles.offseted}`}>
									{parsedHomework[hwDate][lesson].map((hw) => (
										<ContentElement
											pin={pin}
											setChanging={setChangingId}
											key={hw._id}
											removeContent={remove}
											content={hw}
										/>
									))}
								</div>
							</Accordion>
						))}
					</>
				</Accordion>
			))}
			{changingId &&
				changingId !== null &&
				changingHomework !== null &&
				changeContentModalRoot &&
				ReactDOM.createPortal(
					<div className="modal" onMouseDown={() => setChangingId(null)}>
						<ChangeHomework
							initState={changingHomework}
							confirm={(newContent) => {
								update(changingHomework._id, newContent);
								setChangingId(null);
							}}
							reject={() => setChangingId(null)}
						/>
					</div>,
					changeContentModalRoot,
				)}
		</>
	);
});

type CreateHomeworkModalProps = {
	returnHomework: (hw: Pick<homework, 'text' | 'attachments' | 'lesson' | 'to'>) => void;
	close: () => void;
	initContent?: Partial<homework>;
};
const CreateHomeworkModal: React.FC<CreateHomeworkModalProps> = ({
	returnHomework,
	close,
	initContent = {},
}) => {
	if (changeContentModalRoot) {
		return ReactDOM.createPortal(
			<div className={'modal'} onMouseDown={close}>
				<ChangeHomework
					initState={initContent}
					confirm={(homework) => {
						returnHomework(homework);
						close();
					}}
					reject={close}
				/>
			</div>,
			changeContentModalRoot,
		);
	}
	return null;
};

const Add: React.FC<{ onClick: (e: React.MouseEvent<SVGElement, MouseEvent>) => void }> = ({
	onClick,
}) => {
	return (
		<Options
			include={redactorOptions.add}
			props={{
				className: styles.addContent,
				size: 30,
				onClick,
				allowOnlyRedactor: true,
			}}
		/>
	);
};

const parseHomeworkByLesson = (homework: homework[]): { [lesson: string]: homework[] } => {
	const parsedHomework = {} as { [lesson: string]: homework[] } & object;

	for (let hw of homework) {
		const lesson = hw.lesson;
		if (parsedHomework.hasOwnProperty(lesson)) {
			parsedHomework[lesson].push(hw);
		} else {
			parsedHomework[lesson] = [hw];
		}
	}

	return parsedHomework;
};

export default HomeworkSection;
