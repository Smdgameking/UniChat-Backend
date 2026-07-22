const express = require('express');
const route = express.Router();
const {
    sendRequest,
    acceptRequest,
    rejectRequest,
    deleteFriend,
    block,
    unblock,
    listFriends,
    getRequests,
    checkStatus
} = require('../controller/friend.controller');

// Send friend request
// POST /friend/request/:userId
route.post('/request/:userId', sendRequest);

// Accept friend request
// POST /friend/accept/:requestId
route.post('/accept/:requestId', acceptRequest);

// Reject friend request
// POST /friend/reject/:requestId
route.post('/reject/:requestId', rejectRequest);

// Remove friend
// DELETE /friend/:friendId
route.delete('/:friendId', deleteFriend);

// Block user
// POST /friend/block/:userId
route.post('/block/:userId', block);

// Unblock user
// POST /friend/unblock/:userId
route.post('/unblock/:userId', unblock);

// Get friends list
// GET /friend/list
route.get('/list', listFriends);

// Get pending friend requests
// GET /friend/requests
route.get('/requests', getRequests);

// Check friendship status
// GET /friend/status/:userId
route.get('/status/:userId', checkStatus);

module.exports = route;
