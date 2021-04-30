import styles from "../Common/ContentSection.module.css";
import {
	attachment,
	WithTypename,
	homework,
	redactorOptions,
	changeTypes,
	changeableInHomework,
} from "../../../../../types";

import React, {
	Dispatch,
	MouseEventHandler,
	SetStateAction,
	useContext,
	useEffect,
	useState,
} from "react";
import ReactDOM from "react-dom";
import { gql, useSubscription } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client";
import { GoTriangleRight } from "react-icons/go";
import { AiOutlineReload } from "react-icons/ai";
import { useParams } from "react-router-dom";

import {
	parseContentByDate,
	objectForEach,
	getDateStrFromDayMonthStr,
	getPinnedContent,
	concatObjects,
	findContentById,
	separateContentByDate,
} from "../../../../../utils/functions";

import Options from "../../../../Common/Options/Options";
import ChangeHomework from "../../../../Common/ChangeContent/ChangeHomework";
import ContentElement from "../../../../Common/ContentElement";
import Accordion from "../../../../Common/Accordion/Accordion";
import Suspender from "../../../../Common/Suspender/Suspender";
import InfoSection from "../../InfoSection/InfoSection";

import { UserContext } from "../../../../../App";
import ChangePreferences, {
	ChangePreferencesPropsType,
} from "../../../../Common/ChangeContent/ChangePreferences";
import usePolling from "../../../../../hooks/usePolling";
import Modal from "../../../../Common/Modal";
import { stateType } from "../../../../../utils/createContentChanger/createContentChanger";

const changeContentModalRoot = document.getElementById("changeContentModal");

const FIVE_MINS = 1000 * 60 * 5;

const Queries = {
	GET_HOMEWORK: gql`
		query GetHomework($className: String!, $schoolName: String!, $vkId: Int!) {
			homework: getHomework(
				className: $className
				schoolName: $schoolName
				requestingUserVkId: $vkId
			) {
				text
				createdBy
				to
				attachments {
					url
					value
					_id
				}
				userPreferences
				lesson
				pinned
				_id
				onlyFor
				__typename
			}
		}
	`,
};
const Mutations = {
	REMOVE_TASK: gql`
		mutation RemoveTask(
			$className: String!
			$homeworkId: String!
			$schoolName: String!
		) {
			removeHomework(
				homeworkId: $homeworkId
				className: $className
				schoolName: $schoolName
			)
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
				userPreferences
				attachments {
					url
					value
					_id
				}
				to
				lesson
				onlyFor
				pinned
				__typename
			}
		}
	`,
	ADD_HOMEWORK: gql`
		mutation addHomework(
			$schoolName: String!
			$className: String!
			$student_id: Int!
			$content: ClassHomeworkInput!
		) {
			addHomework(
				className: $className
				student_id: $student_id
				schoolName: $schoolName
				content: $content
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
				userPreferences
				onlyFor
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
				userPreferences
				lesson
				createdBy
				onlyFor
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
			pinHomework(
				className: $className
				schoolName: $schoolName
				homeworkId: $homeworkId
			) {
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
				userPreferences
				to
				pinned
				onlyFor
				__typename
			}
		}
	`,
	ON_HOMEWORK_CONFIRMED: gql`
		subscription OnHomeworkConfirmed(
			$className: String!
			$schoolName: String!
		) {
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
				userPreferences
				to
				pinned
				onlyFor
				__typename
			}
		}
	`,
};

const HomeworkSection: React.FC<{}> = ({}) => {
	const { schoolName, className } = useParams<{
		schoolName: string;
		className: string;
	}>();
	const { uid } = useContext(UserContext);
	const [homeworkCreating, setHomeworkCreating] = useState(
		Boolean(localStorage.getItem("homeworkCreating"))
	);
	const [initContent, setInitHomeworkContent] = useState<Partial<homework>>(
		JSON.parse(localStorage.getItem("initHomeworkContent") ?? "{}")
	);

	const homeworkQuery = useQuery<
		{ homework: homework[] },
		{ className: string; schoolName: string; vkId: number }
	>(Queries.GET_HOMEWORK, {
		variables: { className, schoolName, vkId: uid },
	});
	useSubscription<{ onHomeworkAdded: homework | null }>(
		Subscriptions.ON_HOMEWORK_ADDED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const newHomework = subscriptionData.data?.onHomeworkAdded;
				if (newHomework) {
					homeworkQuery.updateQuery(prev => {
						return {
							homework: prev.homework.concat([newHomework]),
						};
					});
				}
			},
		}
	);
	useSubscription<{
		onHomeworkConfirmed: { stabId: string; actualId: string } | null;
	}>(Subscriptions.ON_HOMEWORK_CONFIRMED, {
		variables: { className, schoolName },
		onSubscriptionData: ({ subscriptionData }) => {
			const confirmation = subscriptionData.data?.onHomeworkConfirmed;

			if (confirmation) {
				homeworkQuery.updateQuery(prev => {
					return {
						homework: prev.homework.map(({ _id, ...homework }) =>
							_id === confirmation.stabId
								? { _id: confirmation.actualId, ...homework }
								: { _id, ...homework }
						),
					};
				});
			}
		},
	});
	useSubscription<{ onHomeworksRemoved: string[] | null }>(
		Subscriptions.ON_HOMEWORKS_REMOVED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const removedHomeworksIds = subscriptionData.data?.onHomeworksRemoved;

				if (removedHomeworksIds) {
					homeworkQuery.updateQuery(prev => {
						return {
							homework: prev.homework.filter(
								({ _id }) => !removedHomeworksIds.includes(_id as string)
							),
						};
					});
				}
			},
		}
	);
	useSubscription<{ onHomeworkChanged: Partial<homework> | null }>(
		Subscriptions.ON_HOMEWORK_CHANGED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const updates = subscriptionData.data?.onHomeworkChanged;

				if (updates) {
					homeworkQuery.updateQuery(prev => {
						let homeworkToUpdate = {
							...homeworkQuery.data?.homework.find(
								({ _id }) => updates._id === _id
							),
						};

						if (
							homeworkToUpdate !== undefined &&
							homeworkQuery.data !== undefined
						) {
							for (let updateKey in updates) {
								if (
									updates.hasOwnProperty(updateKey) &&
									//@ts-ignore
									updates[updateKey] != undefined &&
									!["_id", "__typename"].includes(updateKey)
								) {
									//@ts-ignore
									homeworkToUpdate[updateKey] = updates[updateKey];
								}
							}

							return {
								homework: homeworkQuery.data.homework.map(
									({ _id, ...homework }) =>
										_id === updates._id
											? (homeworkToUpdate as homework)
											: { ...homework, _id }
								),
							};
						}

						return prev;
					});
				}
			},
		}
	);
	usePolling(homeworkQuery, FIVE_MINS);

	const setCreating = (val: boolean) => {
		setHomeworkCreating(val);

		if (val) {
			localStorage.setItem("homeworkCreating", val.toString());
		} else {
			localStorage.removeItem("homeworkCreating");
		}
	};
	const setInitContent = (
		val: Partial<homework> | ((prev: Partial<homework>) => Partial<homework>)
	) => {
		const resumedValue = typeof val === "function" ? val(initContent) : val;

		setInitHomeworkContent(val);
		localStorage.setItem("initHomeworkContent", JSON.stringify(resumedValue));
	};

	const [removeOldHomework] = useMutation<
		{ removeOldHomework: homework[] },
		{ className: string; schoolName: string }
	>(Mutations.REMOVE_OLD_HOMEWORK, {
		variables: { className, schoolName },
		optimisticResponse: {
			removeOldHomework:
				homeworkQuery.data?.homework.filter(
					({ to }) => Date.now() - Date.parse(to) <= 24 * 60 * 60 * 1000
				) || [],
		},
		update: (proxy, mutation) => {
			if (mutation && mutation.data?.removeOldHomework) {
				proxy.writeQuery<
					{ homework: homework[] },
					{ className: string; schoolName: string; vkId: number }
				>({
					query: Queries.GET_HOMEWORK,
					variables: { className, schoolName, vkId: uid },
					data: {
						homework: mutation.data.removeOldHomework,
					},
				});
			}
		},
	});

	const [addHomework] = useMutation<
		WithTypename<{
			addHomework: WithTypename<homework>;
		}>,
		{
			className: string;
			schoolName: string;
			content: changeableInHomework;
			student_id: number;
		}
	>(Mutations.ADD_HOMEWORK);
	const add = (homeworkData: changeableInHomework) => {
		addHomework({
			variables: {
				content: homeworkData,
				className,
				schoolName,
				student_id: uid,
			},
			optimisticResponse: {
				__typename: "Mutation",
				addHomework: {
					...homeworkData,
					pinned: false,
					userPreferences: {},
					_id: Date.now().toString(),
					__typename: "ClassHomework",
				},
			},
			refetchQueries: [
				{
					query: Queries.GET_HOMEWORK,
					variables: { className, schoolName, vkId: uid },
				},
			],
		});
		setInitContent({});
	};

	const refetch: MouseEventHandler = e => {
		e.stopPropagation();
		homeworkQuery.refetch();
	};

	return (
		<>
			<InfoSection
				isOpened={
					!!(
						homeworkQuery?.data?.homework &&
						homeworkQuery?.data?.homework.length > 0
					)
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
								className={opened ? styles.triangle_opened : ""}
								size={15}
							/>
						</div>

						<div className={styles.headerButtons}>
							<AiOutlineReload size={23} onClick={refetch} />
							<Add
								onClick={e => {
									e.stopPropagation();
									setCreating(true);
								}}
							/>
						</div>
					</div>
				)}
			>
				<Suspender query={homeworkQuery}>
					{(data: { homework: homework[] }) => {
						const { pastContent, futureContent } = separateContentByDate(
							data.homework
						);
						const pinnedHw = getPinnedContent(data.homework);

						return (
							<div className={styles.content}>
								{pinnedHw.length > 0 && (
									<Accordion
										accordionId="pinnedHomework"
										initiallyOpened={false}
										Head={({ opened }) => (
											<div className={styles.oldContentHeader}>
												<p className={`${styles.date} ${styles.accordion}`}>
													Закрепленное дз
													<GoTriangleRight
														size={15}
														className={opened ? styles.triangle_opened : ""}
													/>
												</p>
											</div>
										)}
									>
										<div className={styles.offseted}>
											<HomeworkLayout
												homework={pinnedHw}
												initiallyOpened={false}
												setHomeworkCreating={setCreating}
												setInitContent={setInitContent}
											/>
										</div>
									</Accordion>
								)}
								{pastContent.length > 0 && (
									<Accordion
										accordionId="oldHomework"
										initiallyOpened={false}
										Head={({ opened }) => (
											<div className={styles.oldContentHeader}>
												<p className={`${styles.date} ${styles.accordion}`}>
													Старое дз
													<GoTriangleRight
														size={15}
														className={opened ? styles.triangle_opened : ""}
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
												homework={pastContent}
												initiallyOpened={false}
												setHomeworkCreating={setCreating}
												setInitContent={setInitContent}
											/>
										</div>
									</Accordion>
								)}
								<HomeworkLayout
									homework={futureContent}
									setHomeworkCreating={setCreating}
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
							setCreating(false);
							setInitContent({});
						}}
						initContent={initContent}
					/>,
					changeContentModalRoot
				)}
		</>
	);
};

const HomeworkLayout: React.FC<{
	homework: homework[];
	initiallyOpened?: boolean;
	setHomeworkCreating: (state: boolean) => void;
	setInitContent: Dispatch<SetStateAction<Partial<homework>>>;
}> = React.memo(
	({
		homework,
		setHomeworkCreating,
		setInitContent,
		initiallyOpened = true,
	}) => {
		const parsedHomework = objectForEach(
			parseContentByDate(homework),
			parseHomeworkByLesson
		);

		const { schoolName, className } = useParams<{
			schoolName: string;
			className: string;
		}>();
		const { uid: userVkId, settings } = useContext(UserContext);

		const [changingInfo, setChangingInfo] = useState<{
			_id: string;
			changeType: changeTypes;
		} | null>(
			JSON.parse(localStorage.getItem("homeworkChangingInfo") ?? "null")
		);
		const changingHomework = changingInfo
			? homework.find(({ _id }) => _id === changingInfo._id)
			: null;
		const [
			changeHomeworkInitState,
			setChangeHomeworkInitState,
		] = useState<Partial<homework> | null>(
			JSON.parse(localStorage.getItem("initHomeworkContent") ?? "null") ??
				changingHomework
		);

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
						__typename: "Mutation",
						removeHomework: homeworkId,
					},
					update: (proxy, res) => {
						const data = proxy.readQuery<
							{ homework: homework[] },
							{ className: string; schoolName: string; vkId: number }
						>({
							query: Queries.GET_HOMEWORK,
							variables: { className, schoolName, vkId: userVkId },
						});

						if (res?.data && data) {
							proxy.writeQuery<
								{ homework: homework[] },
								{ className: string; schoolName: string; vkId: number }
							>({
								query: Queries.GET_HOMEWORK,
								data: {
									homework: data?.homework.filter(hw => hw._id !== homeworkId),
								},
							});
						}
					},
				});
			}
		};

		const [updateHomework] = useMutation<
			WithTypename<{
				updateHomework: WithTypename<Partial<homework>> | null;
			}>,
			{
				className: string;
				schoolName: string;
				homeworkId: string;
				updates: Partial<homework>;
			}
		>(Mutations.CHANGE_HOMEWORK);
		const update = (
			homeworkId: string | undefined,
			updates: Partial<homework>
		) => {
			if (homeworkId) {
				updateHomework({
					variables: {
						className,
						schoolName,
						homeworkId,
						updates,
					},
					optimisticResponse: {
						__typename: "Mutation",
						updateHomework: {
							__typename: "ClassHomework",
							_id: homeworkId,
							...homework.find(hw => hw._id === homeworkId),
							...updates,
						},
					},
					update: (proxy, res) => {
						const data = proxy.readQuery<
							{ homework: homework[] },
							{ className: string; schoolName: string; vkId: number }
						>({
							query: Queries.GET_HOMEWORK,
							variables: { className, schoolName, vkId: userVkId },
						});

						if (res.data && res.data.updateHomework !== null && data) {
							proxy.writeQuery<
								{ homework: homework[] },
								{ className: string; schoolName: string; vkId: number }
							>({
								query: Queries.GET_HOMEWORK,
								variables: { className, schoolName, vkId: userVkId },
								data: {
									homework: data?.homework.map(hw =>
										hw._id === homeworkId
											? { ...hw, ...res.data?.updateHomework }
											: hw
									),
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
			const hw = homework.find(hw => hw._id === homeworkId);

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

		// const [unpinAll] = useMutation<
		// 	{ unpinAllHomework: boolean },
		// 	{ className: string; schoolName: string }
		// >(Mutations.UNPIN_ALL_HOMEWORK, {
		// 	variables: {
		// 		className,
		// 		schoolName,
		// 	},
		// });

		useEffect(() => {
			if (changingHomework === null && changingInfo !== null) {
				setChangingInfo(null);
			}
		}, [changingHomework]);

		const setChanging = (
			newInfo: { _id: string; changeType: changeTypes } | null
		) => {
			setChangingInfo(newInfo);

			localStorage.setItem("homeworkChangingInfo", JSON.stringify(newInfo));

			if (newInfo) {
				setChangeHomeworkInitState(
					homework.find(({ _id }) => _id === newInfo._id) || null
				);
				localStorage.setItem(
					"initHomeworkContent",
					JSON.stringify(
						homework.find(({ _id }) => _id === newInfo._id) || null
					)
				);
			} else {
				setChangeHomeworkInitState(null);
				localStorage.removeItem("initHomeworkContent");
			}
		};

		return (
			<>
				{Object.keys(parsedHomework).map(hwDate => (
					<Accordion
						accordionId={`homework${hwDate}`}
						key={hwDate}
						initiallyOpened={initiallyOpened}
						Head={({ opened }) => (
							<div className={styles.sectionHeader}>
								<div className={`${styles.date} ${styles.accordion}`}>
									{hwDate}
									<GoTriangleRight
										className={opened ? styles.triangle_opened : ""}
										size={15}
									/>
								</div>
								{new Date(hwDate) > new Date() && (
									<Add
										onClick={e => {
											e.stopPropagation();
											setHomeworkCreating(true);
											setInitContent(prev => ({
												...prev,
												to: getDateStrFromDayMonthStr(hwDate),
											}));
										}}
									/>
								)}
							</div>
						)}
					>
						<>
							{Object.keys(parsedHomework[hwDate]).map(lesson => (
								<Accordion
									accordionId={`homework${hwDate}${lesson}`}
									className={styles.offseted}
									key={hwDate + lesson}
									Head={({ opened }) => (
										<div className={styles.sectionHeader}>
											<div className={`${styles.lesson} ${styles.accordion}`}>
												{lesson}
												<GoTriangleRight
													className={opened ? styles.triangle_opened : ""}
													size={15}
												/>
											</div>
											<Add
												onClick={e => {
													e.stopPropagation();
													setHomeworkCreating(true);
													setInitContent(prev => ({
														...prev,
														to: getDateStrFromDayMonthStr(hwDate),
														lesson,
													}));
												}}
											/>
										</div>
									)}
								>
									<div className={`${styles.elements} ${styles.offseted}`}>
										{parsedHomework[hwDate][lesson].map(hw => (
											<ContentElement
												pin={pin}
												setChanging={(_id, changeType) =>
													setChanging({ _id, changeType })
												}
												key={hw._id}
												removeContent={remove}
												content={hw}
												withUserPreferences
											/>
										))}
									</div>
								</Accordion>
							))}
						</>
					</Accordion>
				))}
				{changingInfo && changeHomeworkInitState && changeContentModalRoot && (
					<>
						{changingInfo.changeType === changeTypes.content && (
							<ChangeHomeworkModal
								changeType={changeTypes.content}
								initState={changeHomeworkInitState}
								close={() => setChanging(null)}
								update={update}
								changingHomeworkId={changingInfo._id}
							/>
						)}
						{changingInfo.changeType === changeTypes.userPreferences &&
							ReactDOM.createPortal(
								<ChangeHomeworkModal
									changeType={changeTypes.userPreferences}
									initState={{
										daysForNotification:
											changeHomeworkInitState.userPreferences?.[
												userVkId
											]?.daysForNotification?.join(", ") ??
											settings.daysForNotification,
										notificationTime:
											changeHomeworkInitState.userPreferences?.[userVkId]
												?.notificationTime ?? settings.notificationTime,
										notificationEnabled:
											changeHomeworkInitState.userPreferences?.[userVkId]
												?.notificationEnabled ?? settings.notificationsEnabled,
									}}
									close={() => setChanging(null)}
									update={update}
									changingHomeworkId={changingInfo._id}
								/>,
								changeContentModalRoot
							)}
					</>
				)}
			</>
		);
	}
);

type CreateHomeworkModalProps = {
	returnHomework: (hw: changeableInHomework) => void;
	close: () => void;
	initContent?: Partial<homework>;
};
const CreateHomeworkModal: React.FC<CreateHomeworkModalProps> = ({
	returnHomework,
	close,
	initContent = {},
}) => {
	if (changeContentModalRoot) {
		return (
			<Modal onClose={close} rootElement={changeContentModalRoot}>
				<ChangeHomework
					initState={initContent}
					confirm={homework => {
						returnHomework(homework);
						close();
					}}
					reject={close}
				/>
			</Modal>
		);
	}
	return null;
};
type ChangeHomeworkModalProps =
	| {
			close: () => void;
			initState: Partial<homework>;
			update: (
				homeworkId: string | undefined,
				updates: Partial<WithTypename<homework>>
			) => void;
			changingHomeworkId: string;
			changeType: changeTypes.content;
	  }
	| {
			close: () => void;
			initState: Partial<stateType<ChangePreferencesPropsType>>;
			update: (
				homeworkId: string | undefined,
				updates: Partial<WithTypename<homework>>
			) => void;
			changingHomeworkId: string;
			changeType: changeTypes.userPreferences;
	  };

const ChangeHomeworkModal: React.FC<ChangeHomeworkModalProps> = ({
	close,
	initState,
	update,
	changingHomeworkId,
	changeType,
}) => {
	const { uid: userVkId } = useContext(UserContext);

	if (changeType === changeTypes.content) {
		return (
			<>
				{changeContentModalRoot && (
					<Modal onClose={close} rootElement={changeContentModalRoot}>
						<ChangeHomework
							initState={initState as Partial<homework>}
							//@ts-ignore
							confirm={({ __typename, ...newContent }) => {
								update(changingHomeworkId, newContent);
							}}
							final={close}
						/>
					</Modal>
				)}
			</>
		);
	} else if (changeType === changeTypes.userPreferences) {
		return (
			<>
				{changeContentModalRoot && (
					<Modal onClose={close} rootElement={changeContentModalRoot}>
						<ChangePreferences
							initState={
								initState as Partial<stateType<ChangePreferencesPropsType>>
							}
							confirm={newPreferences => {
								const daysForNotification = newPreferences.daysForNotification
									.split(",")
									.map(s => +s.trim())
									.filter(n => !isNaN(n));

								update(changingHomeworkId, {
									userPreferences: {
										[userVkId]: {
											...newPreferences,
											daysForNotification,
										},
									},
								});
							}}
							final={close}
						/>
					</Modal>
				)}
			</>
		);
	}

	return null;
};

const Add: React.FC<{
	onClick: (e: React.MouseEvent<SVGElement, MouseEvent>) => void;
}> = ({ onClick }) => {
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

const parseHomeworkByLesson = (
	homework: homework[]
): { [lesson: string]: homework[] } => {
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
