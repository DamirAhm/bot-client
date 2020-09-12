import { gql } from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `ID` scalar type represents a unique MongoDB identifier in collection. MongoDB by default use 12-byte ObjectId value (https://docs.mongodb.com/manual/reference/bson-types/#objectid). But MongoDB also may accepts string or integer as correct values for _id field. */
  MongoID: any;
  Date: any;
};

export type Query = {
  __typename?: 'Query';
  studentById?: Maybe<Student>;
  studentByIds?: Maybe<Array<Maybe<Student>>>;
  studentOne?: Maybe<Student>;
  studentMany?: Maybe<Array<Maybe<Student>>>;
  studentCount?: Maybe<Scalars['Int']>;
  studentConnection?: Maybe<StudentConnection>;
  studentPagination?: Maybe<StudentPagination>;
  classById?: Maybe<Class>;
  classByIds?: Maybe<Array<Maybe<Class>>>;
  classOne?: Maybe<Class>;
  classMany?: Maybe<Array<Maybe<Class>>>;
  classCount?: Maybe<Scalars['Int']>;
  classConnection?: Maybe<ClassConnection>;
  classPagination?: Maybe<ClassPagination>;
  getHomework?: Maybe<Array<Maybe<ClassHomework>>>;
  getAnnouncements?: Maybe<Array<Maybe<ClassAnnouncements>>>;
  getLessons?: Maybe<Array<Maybe<Scalars['String']>>>;
  getRoles?: Maybe<Array<Maybe<Scalars['String']>>>;
  studentsForClass?: Maybe<Array<Maybe<Student>>>;
  getSchedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
};


export type QueryStudentByIdArgs = {
  _id: Scalars['MongoID'];
};


export type QueryStudentByIdsArgs = {
  _ids: Array<Maybe<Scalars['MongoID']>>;
  limit?: Maybe<Scalars['Int']>;
  sort?: Maybe<SortFindByIdsStudentInput>;
};


export type QueryStudentOneArgs = {
  filter?: Maybe<FilterFindOneStudentInput>;
  skip?: Maybe<Scalars['Int']>;
  sort?: Maybe<SortFindOneStudentInput>;
};


export type QueryStudentManyArgs = {
  filter?: Maybe<FilterFindManyStudentInput>;
  skip?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  sort?: Maybe<SortFindManyStudentInput>;
};


export type QueryStudentCountArgs = {
  filter?: Maybe<FilterStudentInput>;
};


export type QueryStudentConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  filter?: Maybe<FilterFindManyStudentInput>;
  sort?: Maybe<SortConnectionStudentEnum>;
};


export type QueryStudentPaginationArgs = {
  page?: Maybe<Scalars['Int']>;
  perPage?: Maybe<Scalars['Int']>;
  filter?: Maybe<FilterFindManyStudentInput>;
  sort?: Maybe<SortFindManyStudentInput>;
};


export type QueryClassByIdArgs = {
  _id: Scalars['MongoID'];
};


export type QueryClassByIdsArgs = {
  _ids: Array<Maybe<Scalars['MongoID']>>;
  limit?: Maybe<Scalars['Int']>;
  sort?: Maybe<SortFindByIdsClassInput>;
};


export type QueryClassOneArgs = {
  filter?: Maybe<FilterFindOneClassInput>;
  skip?: Maybe<Scalars['Int']>;
  sort?: Maybe<SortFindOneClassInput>;
};


export type QueryClassManyArgs = {
  filter?: Maybe<FilterFindManyClassInput>;
  skip?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  sort?: Maybe<SortFindManyClassInput>;
};


export type QueryClassCountArgs = {
  filter?: Maybe<FilterClassInput>;
};


export type QueryClassConnectionArgs = {
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
  filter?: Maybe<FilterFindManyClassInput>;
  sort?: Maybe<SortConnectionClassEnum>;
};


export type QueryClassPaginationArgs = {
  page?: Maybe<Scalars['Int']>;
  perPage?: Maybe<Scalars['Int']>;
  filter?: Maybe<FilterFindManyClassInput>;
  sort?: Maybe<SortFindManyClassInput>;
};


export type QueryGetHomeworkArgs = {
  className: Scalars['String'];
  date?: Maybe<Scalars['Date']>;
};


export type QueryGetAnnouncementsArgs = {
  className: Scalars['String'];
  date?: Maybe<Scalars['Date']>;
};


export type QueryStudentsForClassArgs = {
  className?: Maybe<Scalars['String']>;
};


export type QueryGetScheduleArgs = {
  className: Scalars['String'];
};


export type Student = {
  __typename?: 'Student';
  class?: Maybe<Class>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettings>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
  _id: Scalars['MongoID'];
  className?: Maybe<Scalars['String']>;
};

export type Class = {
  __typename?: 'Class';
  students?: Maybe<Array<Maybe<Student>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomework>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncements>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  _id: Scalars['MongoID'];
  /** Number of students */
  studentsCount: Scalars['Int'];
};


export type ClassStudentsArgs = {
  limit?: Maybe<Scalars['Int']>;
  sort?: Maybe<SortFindByIdsStudentInput>;
};

export enum SortFindByIdsStudentInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  VkidAsc = 'VKID_ASC',
  VkidDesc = 'VKID_DESC'
}

export type ClassHomework = {
  __typename?: 'ClassHomework';
  lesson?: Maybe<Scalars['String']>;
  text?: Maybe<Scalars['String']>;
  to?: Maybe<Scalars['Date']>;
  attachments?: Maybe<Array<Maybe<ClassHomeworkAttachments>>>;
  createdBy?: Maybe<Scalars['Float']>;
  _id?: Maybe<Scalars['MongoID']>;
};


export type ClassHomeworkAttachments = {
  __typename?: 'ClassHomeworkAttachments';
  value?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  album_id?: Maybe<Scalars['Float']>;
  _id?: Maybe<Scalars['MongoID']>;
};

export type ClassAnnouncements = {
  __typename?: 'ClassAnnouncements';
  text?: Maybe<Scalars['String']>;
  attachments?: Maybe<Array<Maybe<ClassHomeworkAttachments>>>;
  to?: Maybe<Scalars['Date']>;
  createdBy?: Maybe<Scalars['Float']>;
  _id?: Maybe<Scalars['MongoID']>;
};

export enum EnumStudentRole {
  Student = 'STUDENT',
  Admin = 'ADMIN',
  Contributor = 'CONTRIBUTOR'
}

export type StudentSettings = {
  __typename?: 'StudentSettings';
  notificationsEnabled?: Maybe<Scalars['Boolean']>;
  notificationTime?: Maybe<Scalars['String']>;
  daysForNotification?: Maybe<Array<Maybe<Scalars['Float']>>>;
};

export type FilterFindOneStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterFindOneStudentInput>;
  OR?: Maybe<Array<FilterFindOneStudentInput>>;
  AND?: Maybe<Array<FilterFindOneStudentInput>>;
};

export type StudentSettingsInput = {
  notificationsEnabled?: Maybe<Scalars['Boolean']>;
  notificationTime?: Maybe<Scalars['String']>;
  daysForNotification?: Maybe<Array<Maybe<Scalars['Float']>>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterFindOneStudentInput = {
  vkId?: Maybe<VkIdOperatorsFilterFindOneStudentInput>;
  _id?: Maybe<_IdOperatorsFilterFindOneStudentInput>;
};

export type VkIdOperatorsFilterFindOneStudentInput = {
  gt?: Maybe<Scalars['Float']>;
  gte?: Maybe<Scalars['Float']>;
  lt?: Maybe<Scalars['Float']>;
  lte?: Maybe<Scalars['Float']>;
  ne?: Maybe<Scalars['Float']>;
  in?: Maybe<Array<Maybe<Scalars['Float']>>>;
  nin?: Maybe<Array<Maybe<Scalars['Float']>>>;
};

export type _IdOperatorsFilterFindOneStudentInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortFindOneStudentInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  VkidAsc = 'VKID_ASC',
  VkidDesc = 'VKID_DESC'
}

export type FilterFindManyStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterFindManyStudentInput>;
  OR?: Maybe<Array<FilterFindManyStudentInput>>;
  AND?: Maybe<Array<FilterFindManyStudentInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterFindManyStudentInput = {
  vkId?: Maybe<VkIdOperatorsFilterFindManyStudentInput>;
  _id?: Maybe<_IdOperatorsFilterFindManyStudentInput>;
};

export type VkIdOperatorsFilterFindManyStudentInput = {
  gt?: Maybe<Scalars['Float']>;
  gte?: Maybe<Scalars['Float']>;
  lt?: Maybe<Scalars['Float']>;
  lte?: Maybe<Scalars['Float']>;
  ne?: Maybe<Scalars['Float']>;
  in?: Maybe<Array<Maybe<Scalars['Float']>>>;
  nin?: Maybe<Array<Maybe<Scalars['Float']>>>;
};

export type _IdOperatorsFilterFindManyStudentInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortFindManyStudentInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  VkidAsc = 'VKID_ASC',
  VkidDesc = 'VKID_DESC'
}

export type FilterStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterStudentInput>;
  OR?: Maybe<Array<FilterStudentInput>>;
  AND?: Maybe<Array<FilterStudentInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterStudentInput = {
  vkId?: Maybe<VkIdOperatorsFilterStudentInput>;
  _id?: Maybe<_IdOperatorsFilterStudentInput>;
};

export type VkIdOperatorsFilterStudentInput = {
  gt?: Maybe<Scalars['Float']>;
  gte?: Maybe<Scalars['Float']>;
  lt?: Maybe<Scalars['Float']>;
  lte?: Maybe<Scalars['Float']>;
  ne?: Maybe<Scalars['Float']>;
  in?: Maybe<Array<Maybe<Scalars['Float']>>>;
  nin?: Maybe<Array<Maybe<Scalars['Float']>>>;
};

export type _IdOperatorsFilterStudentInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortConnectionStudentEnum {
  IdDesc = '_ID_DESC',
  IdAsc = '_ID_ASC',
  VkidDesc = 'VKID_DESC',
  VkidAsc = 'VKID_ASC'
}

/** A connection to a list of items. */
export type StudentConnection = {
  __typename?: 'StudentConnection';
  /** Total object count. */
  count: Scalars['Int'];
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Information to aid in pagination. */
  edges: Array<StudentEdge>;
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']>;
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']>;
};

/** An edge in a connection. */
export type StudentEdge = {
  __typename?: 'StudentEdge';
  /** The item at the end of the edge */
  node: Student;
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
};

/** List of items with pagination. */
export type StudentPagination = {
  __typename?: 'StudentPagination';
  /** Total object count. */
  count?: Maybe<Scalars['Int']>;
  /** Array of objects. */
  items?: Maybe<Array<Maybe<Student>>>;
  /** Information to aid in pagination. */
  pageInfo: PaginationInfo;
};

export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  currentPage: Scalars['Int'];
  perPage: Scalars['Int'];
  pageCount?: Maybe<Scalars['Int']>;
  itemCount?: Maybe<Scalars['Int']>;
  hasNextPage?: Maybe<Scalars['Boolean']>;
  hasPreviousPage?: Maybe<Scalars['Boolean']>;
};

export enum SortFindByIdsClassInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC'
}

export type FilterFindOneClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterFindOneClassInput>;
  OR?: Maybe<Array<FilterFindOneClassInput>>;
  AND?: Maybe<Array<FilterFindOneClassInput>>;
};

export type ClassHomeworkInput = {
  lesson?: Maybe<Scalars['String']>;
  text?: Maybe<Scalars['String']>;
  to?: Maybe<Scalars['Date']>;
  attachments?: Maybe<Array<Maybe<ClassHomeworkAttachmentsInput>>>;
  createdBy?: Maybe<Scalars['Float']>;
  _id?: Maybe<Scalars['MongoID']>;
};

export type ClassHomeworkAttachmentsInput = {
  value?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  album_id?: Maybe<Scalars['Float']>;
  _id?: Maybe<Scalars['MongoID']>;
};

export type ClassAnnouncementsInput = {
  text?: Maybe<Scalars['String']>;
  attachments?: Maybe<Array<Maybe<ClassHomeworkAttachmentsInput>>>;
  to?: Maybe<Scalars['Date']>;
  createdBy?: Maybe<Scalars['Float']>;
  _id?: Maybe<Scalars['MongoID']>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterFindOneClassInput = {
  name?: Maybe<NameOperatorsFilterFindOneClassInput>;
  _id?: Maybe<_IdOperatorsFilterFindOneClassInput>;
};

export type NameOperatorsFilterFindOneClassInput = {
  gt?: Maybe<Scalars['String']>;
  gte?: Maybe<Scalars['String']>;
  lt?: Maybe<Scalars['String']>;
  lte?: Maybe<Scalars['String']>;
  ne?: Maybe<Scalars['String']>;
  in?: Maybe<Array<Maybe<Scalars['String']>>>;
  nin?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type _IdOperatorsFilterFindOneClassInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortFindOneClassInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC'
}

export type FilterFindManyClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterFindManyClassInput>;
  OR?: Maybe<Array<FilterFindManyClassInput>>;
  AND?: Maybe<Array<FilterFindManyClassInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterFindManyClassInput = {
  name?: Maybe<NameOperatorsFilterFindManyClassInput>;
  _id?: Maybe<_IdOperatorsFilterFindManyClassInput>;
};

export type NameOperatorsFilterFindManyClassInput = {
  gt?: Maybe<Scalars['String']>;
  gte?: Maybe<Scalars['String']>;
  lt?: Maybe<Scalars['String']>;
  lte?: Maybe<Scalars['String']>;
  ne?: Maybe<Scalars['String']>;
  in?: Maybe<Array<Maybe<Scalars['String']>>>;
  nin?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type _IdOperatorsFilterFindManyClassInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortFindManyClassInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC'
}

export type FilterClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterClassInput>;
  OR?: Maybe<Array<FilterClassInput>>;
  AND?: Maybe<Array<FilterClassInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterClassInput = {
  name?: Maybe<NameOperatorsFilterClassInput>;
  _id?: Maybe<_IdOperatorsFilterClassInput>;
};

export type NameOperatorsFilterClassInput = {
  gt?: Maybe<Scalars['String']>;
  gte?: Maybe<Scalars['String']>;
  lt?: Maybe<Scalars['String']>;
  lte?: Maybe<Scalars['String']>;
  ne?: Maybe<Scalars['String']>;
  in?: Maybe<Array<Maybe<Scalars['String']>>>;
  nin?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type _IdOperatorsFilterClassInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortConnectionClassEnum {
  IdDesc = '_ID_DESC',
  IdAsc = '_ID_ASC',
  NameDesc = 'NAME_DESC',
  NameAsc = 'NAME_ASC'
}

/** A connection to a list of items. */
export type ClassConnection = {
  __typename?: 'ClassConnection';
  /** Total object count. */
  count: Scalars['Int'];
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Information to aid in pagination. */
  edges: Array<ClassEdge>;
};

/** An edge in a connection. */
export type ClassEdge = {
  __typename?: 'ClassEdge';
  /** The item at the end of the edge */
  node: Class;
  /** A cursor for use in pagination */
  cursor: Scalars['String'];
};

/** List of items with pagination. */
export type ClassPagination = {
  __typename?: 'ClassPagination';
  /** Total object count. */
  count?: Maybe<Scalars['Int']>;
  /** Array of objects. */
  items?: Maybe<Array<Maybe<Class>>>;
  /** Information to aid in pagination. */
  pageInfo: PaginationInfo;
};

export type Mutation = {
  __typename?: 'Mutation';
  studentCreateOne?: Maybe<Student>;
  /** Creates Many documents with mongoose defaults, setters, hooks and validation */
  studentCreateMany?: Maybe<CreateManyStudentPayload>;
  /** Update one document: 1) Retrieve one document by findById. 2) Apply updates to mongoose document. 3) Mongoose applies defaults, setters, hooks and validation. 4) And save it. */
  studentUpdateById?: Maybe<UpdateByIdStudentPayload>;
  /** Update one document: 1) Retrieve one document via findOne. 2) Apply updates to mongoose document. 3) Mongoose applies defaults, setters, hooks and validation. 4) And save it. */
  studentUpdateOne?: Maybe<UpdateOneStudentPayload>;
  /** Update many documents without returning them: Use Query.update mongoose method. Do not apply mongoose defaults, setters, hooks and validation.  */
  studentUpdateMany?: Maybe<UpdateManyStudentPayload>;
  /** Remove one document: 1) Retrieve one document and remove with hooks via findByIdAndRemove. 2) Return removed document. */
  studentRemoveById?: Maybe<RemoveByIdStudentPayload>;
  studentRemoveOne?: Maybe<Student>;
  /** Remove many documents without returning them: Use Query.remove mongoose method. Do not apply mongoose defaults, setters, hooks and validation.  */
  studentRemoveMany?: Maybe<RemoveManyStudentPayload>;
  classCreateOne?: Maybe<Class>;
  /** Creates Many documents with mongoose defaults, setters, hooks and validation */
  classCreateMany?: Maybe<CreateManyClassPayload>;
  /** Update one document: 1) Retrieve one document by findById. 2) Apply updates to mongoose document. 3) Mongoose applies defaults, setters, hooks and validation. 4) And save it. */
  classUpdateById?: Maybe<UpdateByIdClassPayload>;
  /** Update one document: 1) Retrieve one document via findOne. 2) Apply updates to mongoose document. 3) Mongoose applies defaults, setters, hooks and validation. 4) And save it. */
  classUpdateOne?: Maybe<UpdateOneClassPayload>;
  /** Update many documents without returning them: Use Query.update mongoose method. Do not apply mongoose defaults, setters, hooks and validation.  */
  classUpdateMany?: Maybe<UpdateManyClassPayload>;
  /** Remove one document: 1) Retrieve one document and remove with hooks via findByIdAndRemove. 2) Return removed document. */
  classRemoveById?: Maybe<RemoveByIdClassPayload>;
  classRemoveOne?: Maybe<Class>;
  /** Remove many documents without returning them: Use Query.remove mongoose method. Do not apply mongoose defaults, setters, hooks and validation.  */
  classRemoveMany?: Maybe<RemoveManyClassPayload>;
  changeDay?: Maybe<Class>;
  changeSettings?: Maybe<Scalars['Boolean']>;
  removeStudentFromClass: Student;
  changeClass?: Maybe<Student>;
  addHomework?: Maybe<ClassHomework>;
  removeHomework?: Maybe<Scalars['String']>;
  updateHomework?: Maybe<ClassHomework>;
  addAnnouncement?: Maybe<ClassAnnouncements>;
  removeAnnouncement?: Maybe<Scalars['String']>;
  updateAnnouncement?: Maybe<ClassAnnouncements>;
  removeOldAnnouncements?: Maybe<Array<Maybe<ClassAnnouncements>>>;
  removeOldHomework?: Maybe<Array<Maybe<ClassHomework>>>;
};


export type MutationStudentCreateOneArgs = {
  vkId: Scalars['Int'];
};


export type MutationStudentCreateManyArgs = {
  records: Array<CreateManyStudentInput>;
};


export type MutationStudentUpdateByIdArgs = {
  record: UpdateByIdStudentInput;
};


export type MutationStudentUpdateOneArgs = {
  record: UpdateOneStudentInput;
  filter?: Maybe<FilterUpdateOneStudentInput>;
  sort?: Maybe<SortUpdateOneStudentInput>;
  skip?: Maybe<Scalars['Int']>;
};


export type MutationStudentUpdateManyArgs = {
  record: UpdateManyStudentInput;
  filter?: Maybe<FilterUpdateManyStudentInput>;
  sort?: Maybe<SortUpdateManyStudentInput>;
  skip?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
};


export type MutationStudentRemoveByIdArgs = {
  _id: Scalars['MongoID'];
};


export type MutationStudentRemoveOneArgs = {
  vkId: Scalars['Int'];
};


export type MutationStudentRemoveManyArgs = {
  filter: FilterRemoveManyStudentInput;
};


export type MutationClassCreateOneArgs = {
  className: Scalars['String'];
};


export type MutationClassCreateManyArgs = {
  records: Array<CreateManyClassInput>;
};


export type MutationClassUpdateByIdArgs = {
  record: UpdateByIdClassInput;
};


export type MutationClassUpdateOneArgs = {
  record: UpdateOneClassInput;
  filter?: Maybe<FilterUpdateOneClassInput>;
  sort?: Maybe<SortUpdateOneClassInput>;
  skip?: Maybe<Scalars['Int']>;
};


export type MutationClassUpdateManyArgs = {
  record: UpdateManyClassInput;
  filter?: Maybe<FilterUpdateManyClassInput>;
  sort?: Maybe<SortUpdateManyClassInput>;
  skip?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
};


export type MutationClassRemoveByIdArgs = {
  _id: Scalars['MongoID'];
};


export type MutationClassRemoveOneArgs = {
  className: Scalars['String'];
};


export type MutationClassRemoveManyArgs = {
  filter: FilterRemoveManyClassInput;
};


export type MutationChangeDayArgs = {
  className: Scalars['String'];
  dayIndex: Scalars['Int'];
  newSchedule: Array<Maybe<Scalars['String']>>;
};


export type MutationChangeSettingsArgs = {
  vkId: Scalars['Int'];
  diffObject?: Maybe<StudentSettingsInput>;
};


export type MutationRemoveStudentFromClassArgs = {
  vkId: Scalars['Int'];
};


export type MutationChangeClassArgs = {
  vkId: Scalars['Int'];
  newClassName: Scalars['String'];
};


export type MutationAddHomeworkArgs = {
  student_id: Scalars['Int'];
  className: Scalars['String'];
  text: Scalars['String'];
  to?: Maybe<Scalars['String']>;
  lesson: Scalars['String'];
  attachments: Array<Maybe<ClassHomeworkAttachmentsInput>>;
};


export type MutationRemoveHomeworkArgs = {
  className: Scalars['String'];
  homeworkId: Scalars['String'];
};


export type MutationUpdateHomeworkArgs = {
  className: Scalars['String'];
  homeworkId: Scalars['String'];
  updates?: Maybe<ClassHomeworkInput>;
};


export type MutationAddAnnouncementArgs = {
  student_id: Scalars['Int'];
  className: Scalars['String'];
  text: Scalars['String'];
  to?: Maybe<Scalars['String']>;
  attachments: Array<Maybe<ClassHomeworkAttachmentsInput>>;
};


export type MutationRemoveAnnouncementArgs = {
  className: Scalars['String'];
  announcementId: Scalars['String'];
};


export type MutationUpdateAnnouncementArgs = {
  className: Scalars['String'];
  announcementId: Scalars['String'];
  updates: ClassAnnouncementsInput;
};


export type MutationRemoveOldAnnouncementsArgs = {
  className: Scalars['String'];
};


export type MutationRemoveOldHomeworkArgs = {
  className: Scalars['String'];
};

export type CreateManyStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role: EnumStudentRole;
  vkId: Scalars['Float'];
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
};

export type CreateManyStudentPayload = {
  __typename?: 'CreateManyStudentPayload';
  /** Created document ID */
  recordIds: Array<Maybe<Scalars['MongoID']>>;
  /** Created documents */
  records: Array<Maybe<Student>>;
  /** Count of all documents created */
  createCount: Scalars['Int'];
};

export type UpdateByIdStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
  _id: Scalars['MongoID'];
};

export type UpdateByIdStudentPayload = {
  __typename?: 'UpdateByIdStudentPayload';
  /** Updated document ID */
  recordId?: Maybe<Scalars['MongoID']>;
  /** Updated document */
  record?: Maybe<Student>;
};

export type UpdateOneStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
};

export type FilterUpdateOneStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterUpdateOneStudentInput>;
  OR?: Maybe<Array<FilterUpdateOneStudentInput>>;
  AND?: Maybe<Array<FilterUpdateOneStudentInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterUpdateOneStudentInput = {
  vkId?: Maybe<VkIdOperatorsFilterUpdateOneStudentInput>;
  _id?: Maybe<_IdOperatorsFilterUpdateOneStudentInput>;
};

export type VkIdOperatorsFilterUpdateOneStudentInput = {
  gt?: Maybe<Scalars['Float']>;
  gte?: Maybe<Scalars['Float']>;
  lt?: Maybe<Scalars['Float']>;
  lte?: Maybe<Scalars['Float']>;
  ne?: Maybe<Scalars['Float']>;
  in?: Maybe<Array<Maybe<Scalars['Float']>>>;
  nin?: Maybe<Array<Maybe<Scalars['Float']>>>;
};

export type _IdOperatorsFilterUpdateOneStudentInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortUpdateOneStudentInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  VkidAsc = 'VKID_ASC',
  VkidDesc = 'VKID_DESC'
}

export type UpdateOneStudentPayload = {
  __typename?: 'UpdateOneStudentPayload';
  /** Updated document ID */
  recordId?: Maybe<Scalars['MongoID']>;
  /** Updated document */
  record?: Maybe<Student>;
};

export type UpdateManyStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
};

export type FilterUpdateManyStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterUpdateManyStudentInput>;
  OR?: Maybe<Array<FilterUpdateManyStudentInput>>;
  AND?: Maybe<Array<FilterUpdateManyStudentInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterUpdateManyStudentInput = {
  vkId?: Maybe<VkIdOperatorsFilterUpdateManyStudentInput>;
  _id?: Maybe<_IdOperatorsFilterUpdateManyStudentInput>;
};

export type VkIdOperatorsFilterUpdateManyStudentInput = {
  gt?: Maybe<Scalars['Float']>;
  gte?: Maybe<Scalars['Float']>;
  lt?: Maybe<Scalars['Float']>;
  lte?: Maybe<Scalars['Float']>;
  ne?: Maybe<Scalars['Float']>;
  in?: Maybe<Array<Maybe<Scalars['Float']>>>;
  nin?: Maybe<Array<Maybe<Scalars['Float']>>>;
};

export type _IdOperatorsFilterUpdateManyStudentInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortUpdateManyStudentInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  VkidAsc = 'VKID_ASC',
  VkidDesc = 'VKID_DESC'
}

export type UpdateManyStudentPayload = {
  __typename?: 'UpdateManyStudentPayload';
  /** Affected documents number */
  numAffected?: Maybe<Scalars['Int']>;
};

export type RemoveByIdStudentPayload = {
  __typename?: 'RemoveByIdStudentPayload';
  /** Removed document ID */
  recordId?: Maybe<Scalars['MongoID']>;
  /** Removed document */
  record?: Maybe<Student>;
};

export type FilterRemoveManyStudentInput = {
  class?: Maybe<Scalars['MongoID']>;
  role?: Maybe<EnumStudentRole>;
  vkId?: Maybe<Scalars['Float']>;
  settings?: Maybe<StudentSettingsInput>;
  lastHomeworkCheck?: Maybe<Scalars['Date']>;
  firstName?: Maybe<Scalars['String']>;
  secondName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  registered?: Maybe<Scalars['Boolean']>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterRemoveManyStudentInput>;
  OR?: Maybe<Array<FilterRemoveManyStudentInput>>;
  AND?: Maybe<Array<FilterRemoveManyStudentInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterRemoveManyStudentInput = {
  vkId?: Maybe<VkIdOperatorsFilterRemoveManyStudentInput>;
  _id?: Maybe<_IdOperatorsFilterRemoveManyStudentInput>;
};

export type VkIdOperatorsFilterRemoveManyStudentInput = {
  gt?: Maybe<Scalars['Float']>;
  gte?: Maybe<Scalars['Float']>;
  lt?: Maybe<Scalars['Float']>;
  lte?: Maybe<Scalars['Float']>;
  ne?: Maybe<Scalars['Float']>;
  in?: Maybe<Array<Maybe<Scalars['Float']>>>;
  nin?: Maybe<Array<Maybe<Scalars['Float']>>>;
};

export type _IdOperatorsFilterRemoveManyStudentInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export type RemoveManyStudentPayload = {
  __typename?: 'RemoveManyStudentPayload';
  /** Affected documents number */
  numAffected?: Maybe<Scalars['Int']>;
};

export type CreateManyClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name: Scalars['String'];
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type CreateManyClassPayload = {
  __typename?: 'CreateManyClassPayload';
  /** Created document ID */
  recordIds: Array<Maybe<Scalars['MongoID']>>;
  /** Created documents */
  records: Array<Maybe<Class>>;
  /** Count of all documents created */
  createCount: Scalars['Int'];
};

export type UpdateByIdClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  _id: Scalars['MongoID'];
};

export type UpdateByIdClassPayload = {
  __typename?: 'UpdateByIdClassPayload';
  /** Updated document ID */
  recordId?: Maybe<Scalars['MongoID']>;
  /** Updated document */
  record?: Maybe<Class>;
};

export type UpdateOneClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type FilterUpdateOneClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterUpdateOneClassInput>;
  OR?: Maybe<Array<FilterUpdateOneClassInput>>;
  AND?: Maybe<Array<FilterUpdateOneClassInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterUpdateOneClassInput = {
  name?: Maybe<NameOperatorsFilterUpdateOneClassInput>;
  _id?: Maybe<_IdOperatorsFilterUpdateOneClassInput>;
};

export type NameOperatorsFilterUpdateOneClassInput = {
  gt?: Maybe<Scalars['String']>;
  gte?: Maybe<Scalars['String']>;
  lt?: Maybe<Scalars['String']>;
  lte?: Maybe<Scalars['String']>;
  ne?: Maybe<Scalars['String']>;
  in?: Maybe<Array<Maybe<Scalars['String']>>>;
  nin?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type _IdOperatorsFilterUpdateOneClassInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortUpdateOneClassInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC'
}

export type UpdateOneClassPayload = {
  __typename?: 'UpdateOneClassPayload';
  /** Updated document ID */
  recordId?: Maybe<Scalars['MongoID']>;
  /** Updated document */
  record?: Maybe<Class>;
};

export type UpdateManyClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type FilterUpdateManyClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterUpdateManyClassInput>;
  OR?: Maybe<Array<FilterUpdateManyClassInput>>;
  AND?: Maybe<Array<FilterUpdateManyClassInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterUpdateManyClassInput = {
  name?: Maybe<NameOperatorsFilterUpdateManyClassInput>;
  _id?: Maybe<_IdOperatorsFilterUpdateManyClassInput>;
};

export type NameOperatorsFilterUpdateManyClassInput = {
  gt?: Maybe<Scalars['String']>;
  gte?: Maybe<Scalars['String']>;
  lt?: Maybe<Scalars['String']>;
  lte?: Maybe<Scalars['String']>;
  ne?: Maybe<Scalars['String']>;
  in?: Maybe<Array<Maybe<Scalars['String']>>>;
  nin?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type _IdOperatorsFilterUpdateManyClassInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export enum SortUpdateManyClassInput {
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC'
}

export type UpdateManyClassPayload = {
  __typename?: 'UpdateManyClassPayload';
  /** Affected documents number */
  numAffected?: Maybe<Scalars['Int']>;
};

export type RemoveByIdClassPayload = {
  __typename?: 'RemoveByIdClassPayload';
  /** Removed document ID */
  recordId?: Maybe<Scalars['MongoID']>;
  /** Removed document */
  record?: Maybe<Class>;
};

export type FilterRemoveManyClassInput = {
  students?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  name?: Maybe<Scalars['String']>;
  homework?: Maybe<Array<Maybe<ClassHomeworkInput>>>;
  schedule?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  announcements?: Maybe<Array<Maybe<ClassAnnouncementsInput>>>;
  roleUpCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
  _id?: Maybe<Scalars['MongoID']>;
  _ids?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  /** List of *indexed* fields that can be filtered via operators. */
  _operators?: Maybe<OperatorsFilterRemoveManyClassInput>;
  OR?: Maybe<Array<FilterRemoveManyClassInput>>;
  AND?: Maybe<Array<FilterRemoveManyClassInput>>;
};

/** For performance reason this type contains only *indexed* fields. */
export type OperatorsFilterRemoveManyClassInput = {
  name?: Maybe<NameOperatorsFilterRemoveManyClassInput>;
  _id?: Maybe<_IdOperatorsFilterRemoveManyClassInput>;
};

export type NameOperatorsFilterRemoveManyClassInput = {
  gt?: Maybe<Scalars['String']>;
  gte?: Maybe<Scalars['String']>;
  lt?: Maybe<Scalars['String']>;
  lte?: Maybe<Scalars['String']>;
  ne?: Maybe<Scalars['String']>;
  in?: Maybe<Array<Maybe<Scalars['String']>>>;
  nin?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type _IdOperatorsFilterRemoveManyClassInput = {
  gt?: Maybe<Scalars['MongoID']>;
  gte?: Maybe<Scalars['MongoID']>;
  lt?: Maybe<Scalars['MongoID']>;
  lte?: Maybe<Scalars['MongoID']>;
  ne?: Maybe<Scalars['MongoID']>;
  in?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
  nin?: Maybe<Array<Maybe<Scalars['MongoID']>>>;
};

export type RemoveManyClassPayload = {
  __typename?: 'RemoveManyClassPayload';
  /** Affected documents number */
  numAffected?: Maybe<Scalars['Int']>;
};


      export interface IntrospectionResultData {
        __schema: {
          types: {
            kind: string;
            name: string;
            possibleTypes: {
              name: string;
            }[];
          }[];
        };
      }
      const result: IntrospectionResultData = {
  "__schema": {
    "types": []
  }
};
      export default result;
    