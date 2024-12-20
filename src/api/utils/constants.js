export const OfferType = {
    PRIMARY: 0,
    COUNTER: 1,
};

export const SwapMode = {
    OPEN: 0,
    PRIVATE: 1,
};

export const SwapModeString = {
    value0: "OPEN",
    value1: "PRIVATE",
};

export const SUE_SWAP_COMPLETE_ACTION_STRING = {
    value0: "REJECTED",
    value1: "COMPLETED"
};

export const SUE_SWAP_CANCEL_ACTION_STRING = {
    value0: "SWAP",
    value1: "PROPOSAL"
};

export const SUE_SWAP_CANCEL_ACTION = {
    SWAP: "SWAP",
    PROPOSAL: "PROPOSAL"
};

export const SwapStatus = {
    PENDING: 1,
    COMPLETED: 2,
    DECLINED: 3,
    CANCELLED: 4
};

export const NotificationStatus = {
    RECEIVED: 1,
    REJECTED: 2,
    COMPLETED: 3,
    COUNTERED: 4,
    COUNTER_REJECTED: 5,
    CANCELLED: 6
};

export const SUE_BlobPictureType = {
    AVATAR: 'profile-avatar',
    COVER: 'profile-cover'
};

export const SUE_ProfileTags = {
    NORMIE: 'normie',
    PREMIUM: 'premium',
    TRADER: 'trader',
    COLLECTOR: 'collector',
    COMMUNITY_MEMBER: 'community-member'
};

export const SUE_PurchaseType = {
    CRYPTO: 1,
    SUBNAME: 2,
    SUBSCRIPTION: 3
};

export const SUE_PaymentMode = {
    SUBSCRIPTION_TOKENS: 1,
    CRYPTO_OR_CARD: 2
};