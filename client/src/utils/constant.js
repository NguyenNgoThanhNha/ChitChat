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