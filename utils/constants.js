module.exports = {
    ROLES: {
        ADMIN: 'admin',
        ORGANIZER: 'organizer',
        USER: 'user'
    },

    TICKET_TYPES: {
        VIP: 'vip',
        STANDARD: 'standard',
        EARLY_BIRD: 'early_bird'
    },

    EVENT_CATEGORIES: [
        'musique', 'sport', 'art',
        'culture', 'food', 'business'
    ],

    RECEIPT_STATUS: {
        PENDING: 'pending',
        PAID: 'paid',
        CANCELLED: 'cancelled'
    },

    PAGINATION: {
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },

    SECURITY: {
        JWT_EXPIRES: '30d',
        PASSWORD_RESET_EXPIRES: 3600000 // 1h en ms
    }
};