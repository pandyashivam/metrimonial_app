import { Sequelize, DataTypes, Model } from 'sequelize';
import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  ForeignKey,
} from 'sequelize';

import { env } from './env.js';

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: env.NODE_ENV === 'development' ? console.log : false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});

// ─── Enums ────────────────────────────────────────────────────────────
export const USER_ROLES = ['USER', 'ADMIN', 'SUPERADMIN'] as const;
export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export const MARITAL_STATUSES = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE'] as const;
export const DIETS = ['VEGETARIAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'JAIN_VEGETARIAN', 'VEGAN'] as const;
export const YES_NO_OCCASIONAL = ['NO', 'OCCASIONALLY', 'YES'] as const;
export const MANGLIK_STATUSES = ['NO', 'YES', 'ANSHIK', 'UNKNOWN'] as const;
export const FAMILY_TYPES = ['NUCLEAR', 'JOINT'] as const;
export const FAMILY_VALUES_ENUM = ['TRADITIONAL', 'MODERATE', 'LIBERAL'] as const;
export const PHOTO_PRIVACIES = ['PUBLIC', 'MEMBERS', 'REQUEST'] as const;
export const MODERATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const VERIFICATION_TIERS = ['BASIC', 'VERIFIED', 'PREMIUM'] as const;
export const INTEREST_STATUSES = ['SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'] as const;
export const REPORT_STATUSES = ['OPEN', 'RESOLVED', 'DISMISSED'] as const;
export const OTP_PURPOSES = ['SIGNUP', 'LOGIN', 'RESET', 'VERIFY_EMAIL', 'VERIFY_PHONE'] as const;
export const SUBSCRIPTION_STATUSES = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'] as const;
export const CONTENT_KINDS = ['SUCCESS_STORY', 'BLOG_POST', 'EVENT'] as const;
export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

// ─── User ─────────────────────────────────────────────────────────────
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare phone: string;
  declare passwordHash: string;
  declare role: CreationOptional<typeof USER_ROLES[number]>;
  declare status: CreationOptional<typeof USER_STATUSES[number]>;
  declare emailVerifiedAt: CreationOptional<Date | null>;
  declare phoneVerifiedAt: CreationOptional<Date | null>;
  declare lastLoginAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  declare profile?: NonAttribute<Profile>;
}

User.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM(...USER_ROLES), defaultValue: 'USER' },
    status: { type: DataTypes.ENUM(...USER_STATUSES), defaultValue: 'ACTIVE' },
    emailVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    phoneVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'users', timestamps: true },
);

// ─── RefreshToken ─────────────────────────────────────────────────────
export class RefreshToken extends Model<InferAttributes<RefreshToken>, InferCreationAttributes<RefreshToken>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<string>;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare revokedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
}

RefreshToken.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    userId: { type: DataTypes.STRING(30), allowNull: false },
    tokenHash: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'refresh_tokens', timestamps: true, updatedAt: false },
);

// ─── Profile ──────────────────────────────────────────────────────────
export class Profile extends Model<InferAttributes<Profile>, InferCreationAttributes<Profile>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<string>;
  declare fullName: string;
  declare gender: typeof GENDERS[number];
  declare dob: Date;
  declare height: string;
  declare weight: CreationOptional<number | null>;
  declare maritalStatus: typeof MARITAL_STATUSES[number];
  declare motherTongue: string;
  declare religion: string;
  declare caste: string;
  declare subCaste: CreationOptional<string | null>;
  declare gotra: CreationOptional<string | null>;
  declare manglik: CreationOptional<typeof MANGLIK_STATUSES[number]>;
  declare rashi: CreationOptional<string | null>;
  declare nakshatra: CreationOptional<string | null>;
  declare education: string;
  declare occupation: string;
  declare income: CreationOptional<string | null>;
  declare city: string;
  declare state: string;
  declare country: CreationOptional<string>;
  declare diet: typeof DIETS[number];
  declare smoking: CreationOptional<typeof YES_NO_OCCASIONAL[number]>;
  declare drinking: CreationOptional<typeof YES_NO_OCCASIONAL[number]>;
  declare aboutMe: string;
  declare familyValues: CreationOptional<typeof FAMILY_VALUES_ENUM[number]>;
  declare personalityTraits: unknown;
  declare hobbies: unknown;
  declare languages: unknown;
  declare complexion: CreationOptional<string | null>;
  declare bodyType: CreationOptional<string | null>;
  declare publicKey: CreationOptional<string | null>;
  declare lastActiveAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  declare photos?: NonAttribute<Photo[]>;
  declare verification?: NonAttribute<Verification>;
  declare family?: NonAttribute<Family>;
  declare horoscope?: NonAttribute<Horoscope>;
  declare preference?: NonAttribute<PartnerPreference>;
  declare embedding?: NonAttribute<ProfileEmbedding>;
}

Profile.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    userId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.ENUM(...GENDERS), allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    height: { type: DataTypes.STRING, allowNull: false },
    weight: { type: DataTypes.INTEGER, allowNull: true },
    maritalStatus: { type: DataTypes.ENUM(...MARITAL_STATUSES), allowNull: false },
    motherTongue: { type: DataTypes.STRING, allowNull: false },
    religion: { type: DataTypes.STRING, allowNull: false },
    caste: { type: DataTypes.STRING, allowNull: false },
    subCaste: { type: DataTypes.STRING, allowNull: true },
    gotra: { type: DataTypes.STRING, allowNull: true },
    manglik: { type: DataTypes.ENUM(...MANGLIK_STATUSES), defaultValue: 'UNKNOWN' },
    rashi: { type: DataTypes.STRING, allowNull: true },
    nakshatra: { type: DataTypes.STRING, allowNull: true },
    education: { type: DataTypes.STRING, allowNull: false },
    occupation: { type: DataTypes.STRING, allowNull: false },
    income: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING, allowNull: false },
    country: { type: DataTypes.STRING, defaultValue: 'India' },
    diet: { type: DataTypes.ENUM(...DIETS), allowNull: false },
    smoking: { type: DataTypes.ENUM(...YES_NO_OCCASIONAL), defaultValue: 'NO' },
    drinking: { type: DataTypes.ENUM(...YES_NO_OCCASIONAL), defaultValue: 'NO' },
    aboutMe: { type: DataTypes.TEXT, allowNull: false },
    familyValues: { type: DataTypes.ENUM(...FAMILY_VALUES_ENUM), defaultValue: 'MODERATE' },
    personalityTraits: { type: DataTypes.JSON, allowNull: false },
    hobbies: { type: DataTypes.JSON, allowNull: false },
    languages: { type: DataTypes.JSON, allowNull: false },
    complexion: { type: DataTypes.STRING, allowNull: true },
    bodyType: { type: DataTypes.STRING, allowNull: true },
    publicKey: { type: DataTypes.STRING(64), allowNull: true },
    lastActiveAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'profiles',
    timestamps: true,
    indexes: [
      { fields: ['gender', 'religion', 'city'] },
      { fields: ['caste', 'motherTongue'] },
      { fields: ['lastActiveAt'] },
    ],
  },
);

// ─── Family ───────────────────────────────────────────────────────────
export class Family extends Model<InferAttributes<Family>, InferCreationAttributes<Family>> {
  declare id: CreationOptional<string>;
  declare profileId: ForeignKey<string>;
  declare fatherName: string;
  declare fatherOccupation: CreationOptional<string | null>;
  declare motherName: string;
  declare motherOccupation: CreationOptional<string | null>;
  declare siblings: unknown;
  declare familyType: CreationOptional<typeof FAMILY_TYPES[number]>;
  declare familyStatus: CreationOptional<string | null>;
  declare nativePlace: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Family.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    profileId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    fatherName: { type: DataTypes.STRING, allowNull: false },
    fatherOccupation: { type: DataTypes.STRING, allowNull: true },
    motherName: { type: DataTypes.STRING, allowNull: false },
    motherOccupation: { type: DataTypes.STRING, allowNull: true },
    siblings: { type: DataTypes.JSON, allowNull: true },
    familyType: { type: DataTypes.ENUM(...FAMILY_TYPES), defaultValue: 'NUCLEAR' },
    familyStatus: { type: DataTypes.STRING, allowNull: true },
    nativePlace: { type: DataTypes.STRING, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'families', timestamps: true },
);

// ─── Horoscope ────────────────────────────────────────────────────────
export class Horoscope extends Model<InferAttributes<Horoscope>, InferCreationAttributes<Horoscope>> {
  declare id: CreationOptional<string>;
  declare profileId: ForeignKey<string>;
  declare birthTime: string;
  declare birthPlace: string;
  declare charan: CreationOptional<string | null>;
  declare nadi: CreationOptional<string | null>;
  declare gana: CreationOptional<string | null>;
  declare yoni: CreationOptional<string | null>;
  declare doshas: unknown;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Horoscope.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    profileId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    birthTime: { type: DataTypes.STRING, allowNull: false },
    birthPlace: { type: DataTypes.STRING, allowNull: false },
    charan: { type: DataTypes.STRING, allowNull: true },
    nadi: { type: DataTypes.STRING, allowNull: true },
    gana: { type: DataTypes.STRING, allowNull: true },
    yoni: { type: DataTypes.STRING, allowNull: true },
    doshas: { type: DataTypes.JSON, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'horoscopes', timestamps: true },
);

// ─── PartnerPreference ────────────────────────────────────────────────
export class PartnerPreference extends Model<InferAttributes<PartnerPreference>, InferCreationAttributes<PartnerPreference>> {
  declare id: CreationOptional<string>;
  declare profileId: ForeignKey<string>;
  declare ageMin: number;
  declare ageMax: number;
  declare heightMin: CreationOptional<string | null>;
  declare heightMax: CreationOptional<string | null>;
  declare religions: unknown;
  declare castes: unknown;
  declare motherTongues: unknown;
  declare education: unknown;
  declare occupation: unknown;
  declare incomeMin: CreationOptional<string | null>;
  declare cities: unknown;
  declare diet: unknown;
  declare manglik: CreationOptional<typeof MANGLIK_STATUSES[number] | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PartnerPreference.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    profileId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    ageMin: { type: DataTypes.INTEGER, allowNull: false },
    ageMax: { type: DataTypes.INTEGER, allowNull: false },
    heightMin: { type: DataTypes.STRING, allowNull: true },
    heightMax: { type: DataTypes.STRING, allowNull: true },
    religions: { type: DataTypes.JSON, allowNull: true },
    castes: { type: DataTypes.JSON, allowNull: true },
    motherTongues: { type: DataTypes.JSON, allowNull: true },
    education: { type: DataTypes.JSON, allowNull: true },
    occupation: { type: DataTypes.JSON, allowNull: true },
    incomeMin: { type: DataTypes.STRING, allowNull: true },
    cities: { type: DataTypes.JSON, allowNull: true },
    diet: { type: DataTypes.JSON, allowNull: true },
    manglik: { type: DataTypes.ENUM(...MANGLIK_STATUSES), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'partner_preferences', timestamps: true },
);

// ─── Photo ────────────────────────────────────────────────────────────
export class Photo extends Model<InferAttributes<Photo>, InferCreationAttributes<Photo>> {
  declare id: CreationOptional<string>;
  declare profileId: ForeignKey<string>;
  declare r2Key: string;
  declare isPrimary: CreationOptional<boolean>;
  declare privacy: CreationOptional<typeof PHOTO_PRIVACIES[number]>;
  declare moderationStatus: CreationOptional<typeof MODERATION_STATUSES[number]>;
  declare uploadedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Photo.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    profileId: { type: DataTypes.STRING(30), allowNull: false },
    r2Key: { type: DataTypes.STRING, allowNull: false },
    isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false },
    privacy: { type: DataTypes.ENUM(...PHOTO_PRIVACIES), defaultValue: 'MEMBERS' },
    moderationStatus: { type: DataTypes.ENUM(...MODERATION_STATUSES), defaultValue: 'PENDING' },
    uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'photos', timestamps: true, indexes: [{ fields: ['profileId'] }] },
);

// ─── Verification ─────────────────────────────────────────────────────
export class Verification extends Model<InferAttributes<Verification>, InferCreationAttributes<Verification>> {
  declare id: CreationOptional<string>;
  declare profileId: ForeignKey<string>;
  declare emailVerified: CreationOptional<boolean>;
  declare phoneVerified: CreationOptional<boolean>;
  declare aadhaarVerified: CreationOptional<boolean>;
  declare selfieVerified: CreationOptional<boolean>;
  declare videoKycVerified: CreationOptional<boolean>;
  declare backgroundVerified: CreationOptional<boolean>;
  declare aadhaarLast4Enc: CreationOptional<string | null>;
  // S3 object keys for the most recent submission of each step. Admins use
  // these to render previews in the moderation queue; the user app
  // overwrites them on each retry so reviewers always see the latest.
  declare selfieKey: CreationOptional<string | null>;
  declare videoKey: CreationOptional<string | null>;
  // Last rejection — surfaced back to the user on /verify so they know what
  // to fix before resubmitting. Cleared when the step is approved.
  declare lastRejectionStep: CreationOptional<string | null>;
  declare lastRejectionReason: CreationOptional<string | null>;
  declare lastRejectionAt: CreationOptional<Date | null>;
  declare trustScore: CreationOptional<number>;
  declare tier: CreationOptional<typeof VERIFICATION_TIERS[number]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Verification.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    profileId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    phoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    aadhaarVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    selfieVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    videoKycVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    backgroundVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    aadhaarLast4Enc: { type: DataTypes.TEXT, allowNull: true },
    selfieKey: { type: DataTypes.STRING(512), allowNull: true },
    videoKey: { type: DataTypes.STRING(512), allowNull: true },
    lastRejectionStep: { type: DataTypes.STRING(40), allowNull: true },
    lastRejectionReason: { type: DataTypes.STRING(500), allowNull: true },
    lastRejectionAt: { type: DataTypes.DATE, allowNull: true },
    trustScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    tier: { type: DataTypes.ENUM(...VERIFICATION_TIERS), defaultValue: 'BASIC' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'verifications', timestamps: true },
);

// ─── Interest ─────────────────────────────────────────────────────────
export class Interest extends Model<InferAttributes<Interest>, InferCreationAttributes<Interest>> {
  declare id: CreationOptional<string>;
  declare fromProfileId: ForeignKey<string>;
  declare toProfileId: ForeignKey<string>;
  declare status: CreationOptional<typeof INTEREST_STATUSES[number]>;
  declare note: CreationOptional<string | null>;
  declare sentAt: CreationOptional<Date>;
  declare respondedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Interest.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    fromProfileId: { type: DataTypes.STRING(30), allowNull: false },
    toProfileId: { type: DataTypes.STRING(30), allowNull: false },
    status: { type: DataTypes.ENUM(...INTEREST_STATUSES), defaultValue: 'SENT' },
    note: { type: DataTypes.TEXT, allowNull: true },
    sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'interests',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['fromProfileId', 'toProfileId'] },
      { fields: ['toProfileId', 'status'] },
      { fields: ['fromProfileId', 'status'] },
    ],
  },
);

// ─── Shortlist ────────────────────────────────────────────────────────
export class Shortlist extends Model<InferAttributes<Shortlist>, InferCreationAttributes<Shortlist>> {
  declare id: CreationOptional<string>;
  declare ownerProfileId: ForeignKey<string>;
  declare savedProfileId: ForeignKey<string>;
  declare savedAt: CreationOptional<Date>;

  declare savedProfile?: NonAttribute<Profile>;
}

Shortlist.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    ownerProfileId: { type: DataTypes.STRING(30), allowNull: false },
    savedProfileId: { type: DataTypes.STRING(30), allowNull: false },
    savedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'shortlists',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['ownerProfileId', 'savedProfileId'] },
      { fields: ['ownerProfileId'] },
    ],
  },
);

// ─── Block ────────────────────────────────────────────────────────────
export class Block extends Model<InferAttributes<Block>, InferCreationAttributes<Block>> {
  declare id: CreationOptional<string>;
  declare blockerProfileId: ForeignKey<string>;
  declare blockedProfileId: ForeignKey<string>;
  declare reason: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
}

Block.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    blockerProfileId: { type: DataTypes.STRING(30), allowNull: false },
    blockedProfileId: { type: DataTypes.STRING(30), allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'blocks',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { unique: true, fields: ['blockerProfileId', 'blockedProfileId'] },
      { fields: ['blockedProfileId'] },
    ],
  },
);

// ─── Report ───────────────────────────────────────────────────────────
export class Report extends Model<InferAttributes<Report>, InferCreationAttributes<Report>> {
  declare id: CreationOptional<string>;
  declare reporterProfileId: ForeignKey<string>;
  declare reportedProfileId: ForeignKey<string>;
  declare reason: string;
  declare detail: CreationOptional<string | null>;
  declare status: CreationOptional<typeof REPORT_STATUSES[number]>;
  declare resolvedByUserId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare reporter?: NonAttribute<Profile>;
  declare reported?: NonAttribute<Profile>;
}

Report.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    reporterProfileId: { type: DataTypes.STRING(30), allowNull: false },
    reportedProfileId: { type: DataTypes.STRING(30), allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    detail: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...REPORT_STATUSES), defaultValue: 'OPEN' },
    resolvedByUserId: { type: DataTypes.STRING(30), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'reports',
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['reportedProfileId'] }],
  },
);

// ─── ProfileView ──────────────────────────────────────────────────────
export class ProfileView extends Model<InferAttributes<ProfileView>, InferCreationAttributes<ProfileView>> {
  declare id: CreationOptional<string>;
  declare viewerProfileId: ForeignKey<string>;
  declare viewedProfileId: ForeignKey<string>;
  declare viewedAt: CreationOptional<Date>;

  declare viewer?: NonAttribute<Profile>;
}

ProfileView.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    viewerProfileId: { type: DataTypes.STRING(30), allowNull: false },
    viewedProfileId: { type: DataTypes.STRING(30), allowNull: false },
    viewedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'profile_views',
    timestamps: false,
    indexes: [
      { fields: ['viewedProfileId', 'viewedAt'] },
      { fields: ['viewerProfileId', 'viewedAt'] },
    ],
  },
);

// ─── Conversation ─────────────────────────────────────────────────────
export class Conversation extends Model<InferAttributes<Conversation>, InferCreationAttributes<Conversation>> {
  declare id: CreationOptional<string>;
  declare profileAId: ForeignKey<string>;
  declare profileBId: ForeignKey<string>;
  declare lastMessageAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare profileA?: NonAttribute<Profile>;
  declare profileB?: NonAttribute<Profile>;
}

Conversation.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    profileAId: { type: DataTypes.STRING(30), allowNull: false },
    profileBId: { type: DataTypes.STRING(30), allowNull: false },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['profileAId', 'profileBId'] },
      { fields: ['profileAId', 'lastMessageAt'] },
      { fields: ['profileBId', 'lastMessageAt'] },
    ],
  },
);

// ─── Message ──────────────────────────────────────────────────────────
export class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {
  declare id: CreationOptional<string>;
  declare conversationId: ForeignKey<string>;
  declare senderProfileId: ForeignKey<string>;
  declare body: string;
  declare nonce: string;
  declare encrypted: CreationOptional<boolean>;
  declare mediaUrl: CreationOptional<string | null>;
  declare mediaMime: CreationOptional<string | null>;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
}

Message.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    conversationId: { type: DataTypes.STRING(30), allowNull: false },
    senderProfileId: { type: DataTypes.STRING(30), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    nonce: { type: DataTypes.STRING(40), allowNull: false },
    encrypted: { type: DataTypes.BOOLEAN, defaultValue: true },
    mediaUrl: { type: DataTypes.STRING, allowNull: true },
    mediaMime: { type: DataTypes.STRING, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['conversationId', 'createdAt'] },
      { fields: ['senderProfileId'] },
    ],
  },
);

// ─── MatchScore ───────────────────────────────────────────────────────
export class MatchScore extends Model<InferAttributes<MatchScore>, InferCreationAttributes<MatchScore>> {
  declare id: CreationOptional<string>;
  declare profileAId: ForeignKey<string>;
  declare profileBId: ForeignKey<string>;
  declare score: number;
  declare reasons: unknown;
  declare computedAt: CreationOptional<Date>;
}

MatchScore.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    profileAId: { type: DataTypes.STRING(30), allowNull: false },
    profileBId: { type: DataTypes.STRING(30), allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false },
    reasons: { type: DataTypes.JSON, allowNull: true },
    computedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'match_scores',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['profileAId', 'profileBId'] },
      { fields: ['profileAId', 'score'] },
    ],
  },
);

// ─── Plan ─────────────────────────────────────────────────────────────
export class Plan extends Model<InferAttributes<Plan>, InferCreationAttributes<Plan>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare priceInr: number;
  declare durationDays: number;
  declare features: unknown;
  declare active: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Plan.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    name: { type: DataTypes.STRING, allowNull: false },
    priceInr: { type: DataTypes.INTEGER, allowNull: false },
    durationDays: { type: DataTypes.INTEGER, allowNull: false },
    features: { type: DataTypes.JSON, allowNull: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'plans', timestamps: true },
);

// ─── Subscription ─────────────────────────────────────────────────────
export class Subscription extends Model<InferAttributes<Subscription>, InferCreationAttributes<Subscription>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<string>;
  declare planId: ForeignKey<string>;
  declare status: CreationOptional<typeof SUBSCRIPTION_STATUSES[number]>;
  declare startsAt: CreationOptional<Date>;
  declare endsAt: Date;
  declare razorpayOrderId: CreationOptional<string | null>;
  declare razorpayPaymentId: CreationOptional<string | null>;
  declare razorpaySignature: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare plan?: NonAttribute<Plan>;
  declare user?: NonAttribute<User>;
}

Subscription.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    userId: { type: DataTypes.STRING(30), allowNull: false },
    planId: { type: DataTypes.STRING(30), allowNull: false },
    status: { type: DataTypes.ENUM(...SUBSCRIPTION_STATUSES), defaultValue: 'PENDING' },
    startsAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    endsAt: { type: DataTypes.DATE, allowNull: false },
    razorpayOrderId: { type: DataTypes.STRING, allowNull: true },
    razorpayPaymentId: { type: DataTypes.STRING, allowNull: true },
    razorpaySignature: { type: DataTypes.STRING, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['razorpayOrderId'] },
    ],
  },
);

// ─── Otp ──────────────────────────────────────────────────────────────
export class Otp extends Model<InferAttributes<Otp>, InferCreationAttributes<Otp>> {
  declare id: CreationOptional<string>;
  declare target: string;
  declare codeHash: string;
  declare purpose: typeof OTP_PURPOSES[number];
  declare expiresAt: Date;
  declare usedAt: CreationOptional<Date | null>;
  declare attempts: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
}

Otp.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    target: { type: DataTypes.STRING, allowNull: false },
    codeHash: { type: DataTypes.STRING, allowNull: false },
    purpose: { type: DataTypes.ENUM(...OTP_PURPOSES), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    usedAt: { type: DataTypes.DATE, allowNull: true },
    attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'otps',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['target', 'purpose'] },
      { fields: ['expiresAt'] },
    ],
  },
);

// ─── Device ───────────────────────────────────────────────────────────
export class Device extends Model<InferAttributes<Device>, InferCreationAttributes<Device>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<string>;
  declare fcmToken: string;
  declare platform: string;
  declare lastSeenAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
}

Device.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    userId: { type: DataTypes.STRING(30), allowNull: false },
    // Long enough to hold a Web Push PushSubscription JSON (~500 chars typical,
    // ~2 KB safe ceiling) as well as short Expo push tokens. We index by a
    // 191-char prefix because a fully unique index over the whole field would
    // exceed MySQL's max key length under utf8mb4.
    fcmToken: { type: DataTypes.STRING(2048), allowNull: false },
    platform: { type: DataTypes.STRING, allowNull: false },
    lastSeenAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'devices',
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['userId'] }, { fields: [{ name: 'fcmToken', length: 191 }], unique: true }],
  },
);

// ─── Content ──────────────────────────────────────────────────────────
export class Content extends Model<InferAttributes<Content>, InferCreationAttributes<Content>> {
  declare id: CreationOptional<string>;
  declare kind: typeof CONTENT_KINDS[number];
  declare slug: string;
  declare title: string;
  declare excerpt: CreationOptional<string | null>;
  declare body: string;
  declare coverKey: CreationOptional<string | null>;
  declare meta: CreationOptional<unknown>;
  declare status: CreationOptional<typeof CONTENT_STATUSES[number]>;
  declare publishedAt: CreationOptional<Date | null>;
  declare authorId: CreationOptional<ForeignKey<string> | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Content.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    kind: { type: DataTypes.ENUM(...CONTENT_KINDS), allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    excerpt: { type: DataTypes.TEXT, allowNull: true },
    body: { type: DataTypes.TEXT('long'), allowNull: false },
    coverKey: { type: DataTypes.STRING, allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.ENUM(...CONTENT_STATUSES), defaultValue: 'DRAFT' },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    authorId: { type: DataTypes.STRING(30), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'contents',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['kind', 'slug'] },
      { fields: ['kind', 'status'] },
      { fields: ['publishedAt'] },
    ],
  },
);

// ─── NotificationPref ─────────────────────────────────────────────────
export class NotificationPref extends Model<InferAttributes<NotificationPref>, InferCreationAttributes<NotificationPref>> {
  declare id: CreationOptional<string>;
  declare userId: ForeignKey<string>;
  declare newInterest: CreationOptional<boolean>;
  declare interestAccepted: CreationOptional<boolean>;
  declare newMessage: CreationOptional<boolean>;
  declare profileViewed: CreationOptional<boolean>;
  declare premiumMatch: CreationOptional<boolean>;
  declare verificationApproved: CreationOptional<boolean>;
  declare updatedAt: CreationOptional<Date>;
}

NotificationPref.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    userId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    newInterest: { type: DataTypes.BOOLEAN, defaultValue: true },
    interestAccepted: { type: DataTypes.BOOLEAN, defaultValue: true },
    newMessage: { type: DataTypes.BOOLEAN, defaultValue: true },
    profileViewed: { type: DataTypes.BOOLEAN, defaultValue: true },
    premiumMatch: { type: DataTypes.BOOLEAN, defaultValue: true },
    verificationApproved: { type: DataTypes.BOOLEAN, defaultValue: true },
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'notification_prefs', timestamps: true, createdAt: false },
);

// ─── Setting ──────────────────────────────────────────────────────────
export class Setting extends Model<InferAttributes<Setting>, InferCreationAttributes<Setting>> {
  declare id: CreationOptional<string>;
  declare key: string;
  declare value: unknown;
  declare updatedAt: CreationOptional<Date>;
  declare updatedBy: CreationOptional<string | null>;
}

Setting.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    value: { type: DataTypes.JSON, allowNull: true },
    updatedAt: DataTypes.DATE,
    updatedBy: { type: DataTypes.STRING(30), allowNull: true },
  },
  { sequelize, tableName: 'settings', timestamps: true, createdAt: false, indexes: [{ fields: ['key'] }] },
);

// ─── AdminLog ─────────────────────────────────────────────────────────
export class AdminLog extends Model<InferAttributes<AdminLog>, InferCreationAttributes<AdminLog>> {
  declare id: CreationOptional<string>;
  declare adminUserId: ForeignKey<string>;
  declare action: string;
  declare targetType: CreationOptional<string | null>;
  declare targetId: CreationOptional<string | null>;
  declare meta: CreationOptional<unknown>;
  declare createdAt: CreationOptional<Date>;

  declare admin?: NonAttribute<User>;
}

AdminLog.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    adminUserId: { type: DataTypes.STRING(30), allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    targetType: { type: DataTypes.STRING, allowNull: true },
    targetId: { type: DataTypes.STRING(30), allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'admin_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['adminUserId', 'createdAt'] },
      { fields: ['action'] },
    ],
  },
);

// ─── ProfileEmbedding ─────────────────────────────────────────────────
export class ProfileEmbedding extends Model<InferAttributes<ProfileEmbedding>, InferCreationAttributes<ProfileEmbedding>> {
  declare id: CreationOptional<string>;
  declare profileId: ForeignKey<string>;
  declare model: string;
  declare dimension: number;
  declare vector: Buffer;
  declare sourceHash: string;
  declare computedAt: CreationOptional<Date>;
}

ProfileEmbedding.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    profileId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    model: { type: DataTypes.STRING, allowNull: false },
    dimension: { type: DataTypes.INTEGER, allowNull: false },
    vector: { type: DataTypes.BLOB('long'), allowNull: false },
    sourceHash: { type: DataTypes.STRING, allowNull: false },
    computedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'profile_embeddings', timestamps: false, indexes: [{ fields: ['model'] }] },
);

// ─── MatchLog ─────────────────────────────────────────────────────────
export class MatchLog extends Model<InferAttributes<MatchLog>, InferCreationAttributes<MatchLog>> {
  declare id: CreationOptional<string>;
  declare viewerProfileId: string;
  declare candidateId: string;
  declare rank: number;
  declare score: number;
  declare variant: CreationOptional<string>;
  declare interacted: CreationOptional<boolean>;
  declare interactionKind: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
}

MatchLog.init(
  {
    id: { type: DataTypes.STRING(30), primaryKey: true, defaultValue: () => cuid() },
    viewerProfileId: { type: DataTypes.STRING(30), allowNull: false },
    candidateId: { type: DataTypes.STRING(30), allowNull: false },
    rank: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.INTEGER, allowNull: false },
    variant: { type: DataTypes.STRING, defaultValue: 'v1' },
    interacted: { type: DataTypes.BOOLEAN, defaultValue: false },
    interactionKind: { type: DataTypes.STRING, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'match_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['viewerProfileId', 'createdAt'] },
      { fields: ['candidateId'] },
      { fields: ['variant'] },
    ],
  },
);

// ─── Associations ─────────────────────────────────────────────────────
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Device, { foreignKey: 'userId' });
Device.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Subscription, { foreignKey: 'userId' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(AdminLog, { foreignKey: 'adminUserId' });
AdminLog.belongsTo(User, { foreignKey: 'adminUserId', as: 'admin' });

User.hasOne(NotificationPref, { foreignKey: 'userId' });
NotificationPref.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Content, { foreignKey: 'authorId' });
Content.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Profile.hasOne(Family, { foreignKey: 'profileId', as: 'family' });
Family.belongsTo(Profile, { foreignKey: 'profileId' });

Profile.hasOne(Horoscope, { foreignKey: 'profileId', as: 'horoscope' });
Horoscope.belongsTo(Profile, { foreignKey: 'profileId' });

Profile.hasOne(PartnerPreference, { foreignKey: 'profileId', as: 'preference' });
PartnerPreference.belongsTo(Profile, { foreignKey: 'profileId' });

Profile.hasOne(Verification, { foreignKey: 'profileId', as: 'verification' });
Verification.belongsTo(Profile, { foreignKey: 'profileId' });

Profile.hasOne(ProfileEmbedding, { foreignKey: 'profileId', as: 'embedding' });
ProfileEmbedding.belongsTo(Profile, { foreignKey: 'profileId' });

Profile.hasMany(Photo, { foreignKey: 'profileId', as: 'photos' });
Photo.belongsTo(Profile, { foreignKey: 'profileId' });

Profile.hasMany(Interest, { foreignKey: 'fromProfileId', as: 'interestsSent' });
Profile.hasMany(Interest, { foreignKey: 'toProfileId', as: 'interestsReceived' });
Interest.belongsTo(Profile, { foreignKey: 'fromProfileId', as: 'fromProfile' });
Interest.belongsTo(Profile, { foreignKey: 'toProfileId', as: 'toProfile' });

Shortlist.belongsTo(Profile, { foreignKey: 'ownerProfileId', as: 'ownerProfile' });
Shortlist.belongsTo(Profile, { foreignKey: 'savedProfileId', as: 'savedProfile' });
Profile.hasMany(Shortlist, { foreignKey: 'ownerProfileId', as: 'shortlistOwner' });
Profile.hasMany(Shortlist, { foreignKey: 'savedProfileId', as: 'shortlistedBy' });

Block.belongsTo(Profile, { foreignKey: 'blockerProfileId', as: 'blocker' });
Block.belongsTo(Profile, { foreignKey: 'blockedProfileId', as: 'blocked' });

Report.belongsTo(Profile, { foreignKey: 'reporterProfileId', as: 'reporter' });
Report.belongsTo(Profile, { foreignKey: 'reportedProfileId', as: 'reported' });

ProfileView.belongsTo(Profile, { foreignKey: 'viewerProfileId', as: 'viewer' });
ProfileView.belongsTo(Profile, { foreignKey: 'viewedProfileId', as: 'viewed' });

Conversation.belongsTo(Profile, { foreignKey: 'profileAId', as: 'profileA' });
Conversation.belongsTo(Profile, { foreignKey: 'profileBId', as: 'profileB' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });
Message.belongsTo(Profile, { foreignKey: 'senderProfileId', as: 'sender' });

MatchScore.belongsTo(Profile, { foreignKey: 'profileAId', as: 'profileA' });
MatchScore.belongsTo(Profile, { foreignKey: 'profileBId', as: 'profileB' });

Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
Plan.hasMany(Subscription, { foreignKey: 'planId' });

// ─── CUID helper ──────────────────────────────────────────────────────
import { randomBytes as cryptoRandomBytes } from 'node:crypto';

let counter = Math.floor(Math.random() * 0x7fffffff);
function cuid(): string {
  const ts = Date.now().toString(36);
  const c = (counter++).toString(36);
  const r = cryptoRandomBytes(4).toString('hex');
  return `c${ts}${c}${r}`;
}

// ─── DB lifecycle ─────────────────────────────────────────────────────
export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: env.NODE_ENV === 'development' });
}

export async function shutdownDb() {
  await sequelize.close();
}
