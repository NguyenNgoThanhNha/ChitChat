export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = "/api/auth"
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/sign-up`
export const SIGNIN_ROUTE = `${AUTH_ROUTES}/sign-in`
export const SIGNOUT_ROUTE = `${AUTH_ROUTES}/sign-out`
export const GET_USER_INFO_ROUTE = `${AUTH_ROUTES}/get-info`
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`
export const ADD_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/add-profile-image`
export const DELETE_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/delete-profile-image`



export const CONTACT_ROUTES = "/api/contact"
export const SEARCH_CONTACT_ROUTE = `${CONTACT_ROUTES}/search`
export const GET_CONTACT_FOR_DM_ROUTE = `${CONTACT_ROUTES}/get-contacts-for-dm`
export const GET_ALL_CONTACT_ROUTE = `${CONTACT_ROUTES}/get-all-contact`

export const FRIEND_REQUEST_ROUTE = `${CONTACT_ROUTES}/friend-request`
export const FRIEND_REQUEST_ITEM_ROUTE = (id) => `${CONTACT_ROUTES}/friend-request/${id}`
export const FRIEND_REQUESTS_INCOMING_ROUTE = `${CONTACT_ROUTES}/friend-requests/incoming`
export const FRIEND_REQUESTS_OUTGOING_ROUTE = `${CONTACT_ROUTES}/friend-requests/outgoing`
export const FRIENDS_ROUTE = `${CONTACT_ROUTES}/friends`
export const REMOVE_FRIEND_ROUTE = (userId) => `${CONTACT_ROUTES}/friends/${userId}`
export const CONTACT_RELATION_ROUTE = (userId) => `${CONTACT_ROUTES}/relation/${userId}`
export const BLOCK_USER_ROUTE = `${CONTACT_ROUTES}/block`
export const UNBLOCK_USER_ROUTE = (userId) => `${CONTACT_ROUTES}/block/${userId}`
export const BLOCKED_USERS_ROUTE = `${CONTACT_ROUTES}/blocked`

export const MESSAGE_ROUTES = "/api/message"
export const GET_MESSAGE_ROUTE = `${MESSAGE_ROUTES}/get-message`
export const UPLOAD_FILE_ROUTE = `${MESSAGE_ROUTES}/upload-file`
export const EDIT_MESSAGE_ROUTE = `${MESSAGE_ROUTES}/edit`
export const DELETE_MESSAGE_ROUTE = `${MESSAGE_ROUTES}/delete`
export const REACT_MESSAGE_ROUTE = `${MESSAGE_ROUTES}/react`
export const SEARCH_MESSAGES_ROUTE = `${MESSAGE_ROUTES}/search`
export const MARK_READ_ROUTE = `${MESSAGE_ROUTES}/mark-read`
export const READ_STATE_ROUTE = `${MESSAGE_ROUTES}/read-state`


export const CHANNEL_ROUTES = "/api/channel"
export const CREATE_CHANNEL_ROUTE = `${CHANNEL_ROUTES}/create`
export const GET_ALL_USER_CHANNELS_ROUTE = `${CHANNEL_ROUTES}/get-all-user-channel`
export const GET_CHANNELS_MESSAGES_ROUTE = `${CHANNEL_ROUTES}/get-channels-messages`
export const CHANNEL_MEMBER_ROLE_ROUTE = (channelId) => `${CHANNEL_ROUTES}/${channelId}/member-role`
export const CHANNEL_ADD_MEMBERS_ROUTE = (channelId) => `${CHANNEL_ROUTES}/${channelId}/members`
export const CHANNEL_REMOVE_MEMBER_ROUTE = (channelId, memberUserId) =>
    `${CHANNEL_ROUTES}/${channelId}/members/${memberUserId}`
export const CHANNEL_LEAVE_ROUTE = (channelId) => `${CHANNEL_ROUTES}/${channelId}/leave`
export const CHANNEL_DELETE_ROUTE = (channelId) => `${CHANNEL_ROUTES}/${channelId}`
export const BLOG_ROUTES = "/api/blog"
export const BLOG_POSTS_ROUTE = `${BLOG_ROUTES}/posts`
export const BLOG_POST_LIKE_ROUTE = (id) => `${BLOG_ROUTES}/posts/${id}/like`
export const BLOG_POST_COMMENTS_ROUTE = (id) => `${BLOG_ROUTES}/posts/${id}/comments`
export const BLOG_POST_SHARE_ROUTE = (id) => `${BLOG_ROUTES}/posts/${id}/share`
export const BLOG_POST_DELETE_ROUTE = (id) => `${BLOG_ROUTES}/posts/${id}`

export const SHOP_ROUTES = "/api/shop"
export const SHOP_PRODUCTS_ROUTE = `${SHOP_ROUTES}/products`
export const SHOP_PRODUCTS_MINE_ROUTE = `${SHOP_ROUTES}/products/mine`
export const SHOP_PRODUCT_ROUTE = (id) => `${SHOP_ROUTES}/products/${id}`
export const SHOP_PRODUCT_UPLOAD_ROUTE = `${SHOP_ROUTES}/products/upload-image`
export const SHOP_CART_ROUTE = `${SHOP_ROUTES}/cart`
export const SHOP_CART_ITEM_ROUTE = (productId) => `${SHOP_ROUTES}/cart/${productId}`
export const SHOP_CHECKOUT_ROUTE = `${SHOP_ROUTES}/orders/checkout`
export const SHOP_ORDERS_MINE_ROUTE = `${SHOP_ROUTES}/orders/mine`
export const SHOP_ORDERS_SALES_ROUTE = `${SHOP_ROUTES}/orders/sales`
export const SHOP_ORDER_STATUS_ROUTE = (id) => `${SHOP_ROUTES}/orders/${id}/status`
export const SHOP_ORDER_ROUTE = (id) => `${SHOP_ROUTES}/orders/${id}`
export const SHOP_PAY_VNPAY_ROUTE = (id) => `${SHOP_ROUTES}/orders/${id}/pay-vnpay`
export const SHOP_PAYMENT_CONFIG_ROUTE = `${SHOP_ROUTES}/payments/config`
export const SHOP_VALIDATE_COUPON_ROUTE = `${SHOP_ROUTES}/payments/validate-coupon`

export const DEFAULT_MESSAGE_PAGE_SIZE = 50