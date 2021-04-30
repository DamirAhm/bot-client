import styles from "../Common/ContentSection.module.css";

import {
	attachment,
	WithTypename,
	announcement,
	redactorOptions,
	changableInAnnouncement,
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
import { useParams } from "react-router-dom";

import {
	parseContentByDate,
	getDateStrFromDayMonthStr,
	concatObjects,
	getPinnedContent,
	findContentById,
} from "../../../../../utils/functions";

import Accordion from "../../../../Common/Accordion/Accordion";
import Suspender from "../../../../Common/Suspender/Suspender";
import ChangeContent, {
	ChangeContentPropsType,
} from "../../../../Common/ChangeContent/ChangeContent";
import Options from "../../../../Common/Options/Options";
import InfoSection from "../../InfoSection/InfoSection";
import ContentElement from "../../../../Common/ContentElement";

import { UserContext } from "../../../../../App";
import usePolling from "../../../../../hooks/usePolling";
import Modal from "../../../../Common/Modal";
import { stateType } from "../../../../../utils/createContentChanger/createContentChanger";
import { AiOutlineReload } from "react-icons/ai";

const announcementContentModalRoot = document.getElementById(
	"changeContentModal"
);

const FIVE_MINS = 1000 * 60 * 5;

const Queries = {
	GET_ANNOUNCEMENTS: gql`
		query GetAnnouncements(
			$className: String!
			$schoolName: String!
			$vkId: Int!
		) {
			announcements: getAnnouncements(
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
				_id
				onlyFor
				__typename
			}
		}
	`,
};
const Mutations = {
	ADD_ANNOUNCEMENT: gql`
		mutation addAnnouncement(
			$className: String!
			$schoolName: String!
			$student_id: Int!
			$content: ClassAnnouncementsInput!
		) {
			addAnnouncement(
				className: $className
				schoolName: $schoolName
				student_id: $student_id
				content: $content
			) {
				text
				_id
				to
				attachments {
					url
					value
				}
				onlyFor
				__typename
			}
		}
	`,
	REMOVE_ANNOUNCEMENT: gql`
		mutation RemoveAnnouncement(
			$className: String!
			$announcementId: String!
			$schoolName: String!
		) {
			removeAnnouncement(
				announcementId: $announcementId
				className: $className
				schoolName: $schoolName
			)
		}
	`,
	UPDATE_ANNOUNCEMENT: gql`
		mutation UpdateAnnouncement(
			$className: String!
			$schoolName: String!
			$announcementId: String!
			$updates: ClassAnnouncementsInput!
		) {
			updateAnnouncement(
				className: $className
				announcementId: $announcementId
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
				onlyFor
			}
		}
	`,
	REMOVE_OLD_ANNOUNCEMENTS: gql`
		mutation RemoveOldAnnouncements($className: String!, $schoolName: String!) {
			removeOldAnnouncements(className: $className, schoolName: $schoolName) {
				to
				text
				attachments {
					url
					value
					_id
				}
				createdBy
				onlyFor
				_id
			}
		}
	`,
	TOGGLE_PIN_ANNOUNCEMENT: gql`
		mutation TogglePinAnnouncements(
			$className: String!
			$schoolName: String!
			$announcementId: String!
		) {
			pinAnnouncement(
				className: $className
				schoolName: $schoolName
				announcementId: $announcementId
			) {
				_id
				pinned
			}
		}
	`,
	UNPIN_ALL_ANNOUNCEMENTS: gql`
		mutation UnpinAllAnnouncements($className: String!, $schoolName: String!) {
			unpinAllAnnouncements(className: $className, schoolName: $schoolName)
		}
	`,
};
const Subscriptions = {
	ON_ANNOUNCEMENT_ADDED: gql`
		subscription OnAnnouncementAdded(
			$className: String!
			$schoolName: String!
		) {
			onAnnouncementAdded(className: $className, schoolName: $schoolName) {
				_id
				text
				attachments {
					url
					value
					_id
				}
				to
				pinned
				onlyFor
				__typename
			}
		}
	`,
	ON_ANNOUNCEMENT_CONFIRMED: gql`
		subscription OnAnnouncementConfirmed(
			$className: String!
			$schoolName: String!
		) {
			onAnnouncementConfirmed(className: $className, schoolName: $schoolName) {
				stabId
				actualId
			}
		}
	`,
	ON_ANNOUNCEMENTS_REMOVED: gql`
		subscription OnAnnouncementsRemoved(
			$className: String!
			$schoolName: String!
		) {
			onAnnouncementsRemoved(className: $className, schoolName: $schoolName)
		}
	`,
	ON_ANNOUNCEMENT_CHANGED: gql`
		subscription OnAnnouncementChanged(
			$className: String!
			$schoolName: String!
		) {
			onAnnouncementChanged(className: $className, schoolName: $schoolName) {
				_id
				text
				attachments {
					url
					value
					_id
				}
				to
				pinned
				onlyFor
				__typename
			}
		}
	`,
};

const AnnouncementsSection: React.FC<{}> = ({}) => {
	const { className, schoolName } = useParams<{
		className: string;
		schoolName: string;
	}>();
	const { uid } = useContext(UserContext);
	const [announcementCreating, setAnnouncementCreating] = useState(
		Boolean(localStorage.getItem("announcementCreating"))
	);
	const [initContent, setInitAnnouncementContent] = useState<
		Partial<announcement>
	>(JSON.parse(localStorage.getItem("initAnnouncementContent") ?? "{}"));

	const announcementsQuery = useQuery<
		{ announcements: announcement[] },
		{ schoolName: string; className: string; vkId: number }
	>(Queries.GET_ANNOUNCEMENTS, {
		variables: { className, schoolName, vkId: uid },
	});
	useSubscription<{ onAnnouncementAdded: announcement | null }>(
		Subscriptions.ON_ANNOUNCEMENT_ADDED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const newAnnouncement = subscriptionData.data?.onAnnouncementAdded;
				if (newAnnouncement) {
					announcementsQuery.updateQuery(prev => {
						return {
							announcements: prev.announcements.concat([newAnnouncement]),
						};
					});
				}
			},
		}
	);
	useSubscription<{
		onAnnouncementConfirmed: { stabId: string; actualId: string } | null;
	}>(Subscriptions.ON_ANNOUNCEMENT_CONFIRMED, {
		variables: { className, schoolName },
		onSubscriptionData: ({ subscriptionData }) => {
			const confirmation = subscriptionData.data?.onAnnouncementConfirmed;

			if (confirmation) {
				announcementsQuery.updateQuery(prev => {
					return {
						announcements: prev.announcements.map(({ _id, ...announcement }) =>
							_id === confirmation.stabId
								? { _id: confirmation.actualId, ...announcement }
								: { _id, ...announcement }
						),
					};
				});
			}
		},
	});
	useSubscription<{ onAnnouncementsRemoved: string[] | null }>(
		Subscriptions.ON_ANNOUNCEMENTS_REMOVED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const removedAnnouncementsIds =
					subscriptionData.data?.onAnnouncementsRemoved;

				if (removedAnnouncementsIds) {
					announcementsQuery.updateQuery(prev => {
						return {
							announcements: prev.announcements.filter(
								({ _id }) => !removedAnnouncementsIds.includes(_id as string)
							),
						};
					});
				}
			},
		}
	);
	useSubscription<{ onAnnouncementChanged: Partial<announcement> | null }>(
		Subscriptions.ON_ANNOUNCEMENT_CHANGED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const updates = subscriptionData.data?.onAnnouncementChanged;

				if (updates) {
					announcementsQuery.updateQuery(prev => {
						let announcementToUpdate = {
							...announcementsQuery.data?.announcements.find(
								({ _id }) => updates._id === _id
							),
						};

						if (
							announcementToUpdate !== undefined &&
							announcementsQuery.data !== undefined
						) {
							for (let updateKey in updates) {
								if (
									updates.hasOwnProperty(updateKey) &&
									//@ts-ignore
									updates[updateKey] != undefined &&
									!["_id", "__typename"].includes(updateKey)
								) {
									//@ts-ignore
									announcementToUpdate[updateKey] = updates[updateKey];
								}
							}

							return {
								announcements: announcementsQuery.data.announcements.map(
									({ _id, ...announcement }) =>
										_id === updates._id
											? (announcementToUpdate as announcement)
											: { ...announcement, _id }
								),
							};
						}

						return prev;
					});
				}
			},
		}
	);
	usePolling(announcementsQuery, FIVE_MINS);

	const setCreating = (val: boolean) => {
		setAnnouncementCreating(val);

		if (val) {
			localStorage.setItem("announcementCreating", val.toString());
		} else {
			localStorage.removeItem("announcementCreating");
		}
	};
	const setInitContent = (
		val:
			| Partial<announcement>
			| ((prev: Partial<announcement>) => Partial<announcement>)
	) => {
		const resumedValue = typeof val === "function" ? val(initContent) : val;

		setInitAnnouncementContent(val);
		localStorage.setItem(
			"initAnnouncementContent",
			JSON.stringify(resumedValue)
		);
	};

	const [removeOldAnnouncements] = useMutation<
		{ removeOldAnnouncements: announcement[] },
		{ className: string; schoolName: string }
	>(Mutations.REMOVE_OLD_ANNOUNCEMENTS, {
		variables: { className, schoolName },
		optimisticResponse: {
			removeOldAnnouncements:
				announcementsQuery.data?.announcements?.filter(
					({ to }) => Date.now() - Date.parse(to) <= 24 * 60 * 60 * 1000
				) || [],
		},
		update: (proxy, mutation) => {
			if (mutation && mutation.data?.removeOldAnnouncements) {
				proxy.writeQuery<
					{ announcements: announcement[] },
					{ className: string; schoolName: string; vkId: number }
				>({
					query: Queries.GET_ANNOUNCEMENTS,
					variables: { className, schoolName, vkId: uid },
					data: {
						announcements: mutation.data.removeOldAnnouncements,
					},
				});
			}
		},
	});

	const [addAnnouncement] = useMutation<
		WithTypename<{
			addAnnouncement: WithTypename<announcement>;
		}>,
		{
			className: string;
			schoolName: string;
			student_id: number;
			content: changableInAnnouncement;
		}
	>(Mutations.ADD_ANNOUNCEMENT);
	const add = (announcementData: changableInAnnouncement) => {
		addAnnouncement({
			variables: {
				content: announcementData,
				className,
				schoolName,
				student_id: uid,
			},
			optimisticResponse: {
				__typename: "Mutation",
				addAnnouncement: {
					...announcementData,
					pinned: false,
					_id: Date.now().toString(),
					__typename: "ClassAnnouncement",
				},
			},
			refetchQueries: [
				{
					query: Queries.GET_ANNOUNCEMENTS,
					variables: { className, schoolName, vkId: uid },
				},
			],
		});
	};

	const refetch: MouseEventHandler = e => {
		e.stopPropagation();

		announcementsQuery.refetch();
	};

	return (
		<>
			<InfoSection
				isOpened={
					!!(
						announcementsQuery?.data?.announcements &&
						announcementsQuery?.data?.announcements.length > 0
					)
				}
				name="Обьявления"
				Header={({ opened, onClick }) => (
					<div
						className={`${styles.sectionHeader} ${styles.contentHeader}`}
						onClick={onClick}
					>
						<div className={styles.title}>
							Обьявления
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
				<Suspender query={announcementsQuery}>
					{({
						announcements,
					}: {
						announcements?: WithTypename<announcement>[];
					}) => {
						if (announcements) {
							const [
								oldAnnouncements,
								actualAnnouncements,
							] = parseContentByDate(announcements);

							const pinnedAnnouncements = concatObjects(
								parseContentByDate(getPinnedContent(announcements))
							);

							return (
								<div className={styles.content}>
									{Object.keys(pinnedAnnouncements).length > 0 && (
										<Accordion
											accordionId="pinnedAnnouncements"
											initiallyOpened={false}
											Head={({ opened }) => (
												<div className={styles.oldContentHeader}>
													<p className={`${styles.date} ${styles.accordion}`}>
														Закрепленные обьявления
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
															onClick: () => removeOldAnnouncements(),
														}}
													/>
												</div>
											)}
										>
											<div className={styles.offseted}>
												<AnnouncementLayout
													announcements={oldAnnouncements}
													initiallyOpened={false}
													setAnnouncementCreating={setCreating}
													setInitContent={setInitContent}
												/>
											</div>
										</Accordion>
									)}
									{Object.keys(oldAnnouncements).length > 0 && (
										<Accordion
											accordionId="oldAnnouncements"
											initiallyOpened={false}
											Head={({ opened }) => (
												<div className={styles.oldContentHeader}>
													<p className={`${styles.date} ${styles.accordion}`}>
														Старые обьявления
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
															onClick: () => removeOldAnnouncements(),
														}}
													/>
												</div>
											)}
										>
											<div className={styles.offseted}>
												<AnnouncementLayout
													announcements={oldAnnouncements}
													initiallyOpened={false}
													setAnnouncementCreating={setCreating}
													setInitContent={setInitContent}
												/>
											</div>
										</Accordion>
									)}
									<AnnouncementLayout
										announcements={actualAnnouncements}
										setAnnouncementCreating={setCreating}
										setInitContent={setInitContent}
									/>
								</div>
							);
						} else {
							return null;
						}
					}}
				</Suspender>
			</InfoSection>
			{announcementContentModalRoot &&
				announcementCreating &&
				ReactDOM.createPortal(
					<CreateAnnouncementModal
						returnAnnouncement={add}
						close={() => setCreating(false)}
						initContent={initContent}
					/>,
					announcementContentModalRoot
				)}
		</>
	);
};

type AnnouncementLayoutProps = {
	announcements: {
		[day: string]: announcement[];
	};
	initiallyOpened?: boolean;
	setAnnouncementCreating: (state: boolean) => void;
	setInitContent: Dispatch<SetStateAction<Partial<announcement>>>;
};
const AnnouncementLayout: React.FC<AnnouncementLayoutProps> = React.memo(
	({
		announcements,
		setAnnouncementCreating,
		setInitContent,
		initiallyOpened = true,
	}) => {
		const { uid } = useContext(UserContext);
		const { schoolName, className } = useParams<{
			className: string;
			schoolName: string;
		}>();

		const [changingInfo, setChangingInfo] = useState<{
			_id: string;
		} | null>(
			JSON.parse(localStorage.getItem("announcementChangingInfo") ?? "null")
		);
		const changingAnnouncementNew = changingInfo
			? findContentById(announcements, changingInfo._id)
			: null;
		const [
			changingAnnouncementInitState,
			setChangeAnnouncementInitState,
		] = useState<Partial<announcement> | null>(
			JSON.parse(localStorage.getItem("initAnnouncementContent") ?? "null") ??
				changingAnnouncementNew
		);

		const [removeAnnouncement] = useMutation<
			WithTypename<{
				removeAnnouncement: string;
			}>,
			{
				className: string;
				schoolName: string;
				announcementId: string;
			}
		>(Mutations.REMOVE_ANNOUNCEMENT);
		const remove = (announcementId: string | undefined) => {
			if (announcementId) {
				removeAnnouncement({
					variables: { className, announcementId, schoolName },
					optimisticResponse: {
						__typename: "Mutation",
						removeAnnouncement: announcementId,
					},
					update: (proxy, res) => {
						const data = proxy.readQuery<{ announcements: announcement[] }>({
							query: Queries.GET_ANNOUNCEMENTS,
							variables: { className, schoolName, vkId: uid },
						});

						if (res?.data) {
							proxy.writeQuery<
								{ announcements: announcement[] },
								{ className: string; schoolName: string; vkId: number }
							>({
								query: Queries.GET_ANNOUNCEMENTS,
								variables: { className, schoolName, vkId: uid },
								data: {
									announcements:
										data?.announcements.filter(
											announcement => announcement._id !== announcementId
										) || [],
								},
							});
						}
					},
				});
			}
		};

		const [updateAnnouncement] = useMutation<
			WithTypename<{
				updateAnnouncement: Partial<announcement>;
			}>,
			{
				className: string;
				schoolName: string;
				announcementId: string;
				updates: Partial<announcement>;
			}
		>(Mutations.UPDATE_ANNOUNCEMENT);
		const update = (
			announcementId: string | undefined,
			updates: Partial<announcement>
		) => {
			if (announcementId) {
				updateAnnouncement({
					variables: {
						className,
						schoolName,
						announcementId,
						updates,
					},
					optimisticResponse: {
						__typename: "Mutation",
						updateAnnouncement: {
							_id: announcementId,
							...Object.values(announcements)
								.flat()
								.find(hw => hw._id === announcementId),
							...updates,
						},
					},
					update: (proxy, res) => {
						const data = proxy.readQuery<{ announcements: announcement[] }>({
							query: Queries.GET_ANNOUNCEMENTS,
							variables: { className, schoolName, vkId: uid },
						});

						if (res?.data) {
							proxy.writeQuery<
								{ announcements: announcement[] },
								{ className: string; schoolName: string; vkId: number }
							>({
								query: Queries.GET_ANNOUNCEMENTS,
								variables: { className, schoolName, vkId: uid },
								data: {
									announcements:
										data?.announcements.map(announcement =>
											announcement._id === announcementId
												? { ...announcement, ...res.data?.updateAnnouncement }
												: announcement
										) || [],
								},
							});
						}
					},
				});
			}
		};

		const [pinAnnouncement] = useMutation<
			{ pinAnnouncement: { _id: string; pinned: boolean } },
			{ schoolName: string; className: string; announcementId: string }
		>(Mutations.TOGGLE_PIN_ANNOUNCEMENT);
		const pin = (announcementId: string) => {
			const announcement = Object.values(announcements)
				.flat()
				.find(annnouncement => annnouncement._id === announcementId);

			if (announcement) {
				pinAnnouncement({
					optimisticResponse: {
						pinAnnouncement: {
							_id: announcementId,
							pinned: !announcement.pinned,
						},
					},
					variables: {
						className,
						schoolName,
						announcementId,
					},
				});
			}
		};

		const [unpinAll] = useMutation<
			{ unpinAllAnnouncements: boolean },
			{ className: string; schoolName: string }
		>(Mutations.UNPIN_ALL_ANNOUNCEMENTS, {
			variables: {
				className,
				schoolName,
			},
		});

		const setChanging = (newInfo: { _id: string } | null) => {
			setChangingInfo(newInfo);

			localStorage.setItem("announcementChangingInfo", JSON.stringify(newInfo));

			if (newInfo) {
				setChangeAnnouncementInitState(
					findContentById(announcements, newInfo._id)
				);
				localStorage.setItem(
					"initAnnouncementContent",
					JSON.stringify(findContentById(announcements, newInfo._id))
				);
			} else {
				setChangeAnnouncementInitState(null);
				localStorage.removeItem("initAnnouncementContent");
			}
		};

		useEffect(() => {
			if (changingAnnouncementNew?._id === undefined) {
				setChangingInfo(null);
			}
		});

		return (
			<>
				{Object.keys(announcements).map(announcementDate => (
					<Accordion
						accordionId={`announcements${announcementDate}`}
						initiallyOpened={initiallyOpened}
						key={announcementDate}
						Head={({ opened }) => (
							<div className={styles.sectionHeader}>
								<div className={styles.title}>
									{announcementDate}
									<GoTriangleRight
										className={opened ? styles.triangle_opened : ""}
										size={15}
									/>
								</div>
								{new Date(announcementDate) > new Date() && (
									<Add
										onClick={e => {
											e.stopPropagation();
											setAnnouncementCreating(true);
											setInitContent(prev => ({
												...prev,
												to: getDateStrFromDayMonthStr(announcementDate),
											}));
										}}
									/>
								)}
							</div>
						)}
					>
						<>
							<div className={`${styles.elements} ${styles.offseted}`}>
								{announcements[announcementDate].map((announcement, i) => (
									<ContentElement
										pin={pin}
										setChanging={_id => {
											setChanging({ _id });
										}}
										key={announcement._id}
										removeContent={remove}
										content={announcement}
									/>
								))}
							</div>
						</>
					</Accordion>
				))}

				{changingInfo?._id !== undefined &&
					changingAnnouncementInitState !== null && (
						<ChangeAnnouncementModal
							initState={changingAnnouncementInitState}
							update={update}
							close={() => setChanging(null)}
							changingAnnouncementId={changingInfo._id}
						/>
					)}
			</>
		);
	}
);

type CreateAnnouncementModalProps = {
	initContent?: Partial<announcement>;
	returnAnnouncement: (hw: changableInAnnouncement) => void;
	close: () => void;
};
const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
	returnAnnouncement,
	close,
	initContent = {},
}) => {
	if (announcementContentModalRoot) {
		return (
			<Modal onClose={close} rootElement={announcementContentModalRoot}>
				<ChangeContent
					initState={initContent}
					confirm={content => {
						returnAnnouncement(content);
						close();
					}}
					reject={close}
				/>
			</Modal>
		);
	}
	return null;
};
type ChangeAnnouncementModalProps = {
	initState: Partial<stateType<ChangeContentPropsType>>;
	update: (
		announcementId: string,
		changedAnnouncement: Partial<stateType<ChangeContentPropsType>>
	) => void;
	close: () => void;
	changingAnnouncementId: string;
};
const ChangeAnnouncementModal: React.FC<ChangeAnnouncementModalProps> = ({
	close,
	initState,
	update,
	changingAnnouncementId,
}) => {
	if (announcementContentModalRoot) {
		return (
			<Modal rootElement={announcementContentModalRoot} onClose={close}>
				<ChangeContent
					initState={initState}
					confirm={newContent => {
						update(changingAnnouncementId, newContent);
					}}
					final={close}
				/>
			</Modal>
		);
	} else {
		return null;
	}
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

export default AnnouncementsSection;
