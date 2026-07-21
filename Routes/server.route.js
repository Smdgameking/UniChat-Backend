const express = require('express');
const route = express.Router();
const Server = require('../models/server.model');
const Channel = require('../models/channel.model');
const ServerMember = require('../models/serverMember.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Create a new server
route.post('/create', async (req, res) => {
    try {
        const { name, description, icon } = req.body;
        const ownerId = req.user.id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Server name is required'
            });
        }

        // Create server
        const server = new Server({
            name: name.trim(),
            description: description || '',
            icon: icon || null,
            owner: ownerId,
            members: [ownerId]
        });

        await server.save();

        // Add owner as server member
        const serverMember = new ServerMember({
            server: server._id,
            user: ownerId,
            role: 'owner'
        });

        await serverMember.save();

        // Create default "general" channel
        const generalChannel = new Channel({
            name: 'general',
            type: 'text',
            description: 'General discussion',
            server: server._id
        });

        await generalChannel.save();

        res.status(201).json({
            success: true,
            server: {
                id: server._id,
                name: server.name,
                icon: server.icon,
                description: server.description
            }
        });
    } catch (error) {
        console.error('Create server error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get user's servers
route.get('/list', async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all server memberships for the user
        const memberships = await ServerMember.find({ user: userId })
            .populate('server')
            .lean();

        // Build server list
        const servers = memberships.map(membership => ({
            id: membership.server._id,
            name: membership.server.name,
            icon: membership.server.icon,
            description: membership.server.description
        }));

        res.status(200).json({
            success: true,
            servers
        });
    } catch (error) {
        console.error('Get servers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch servers'
        });
    }
});

// Join a server
route.post('/:serverId/join', async (req, res) => {
    try {
        const { serverId } = req.params;
        const userId = req.user.id;

        // Check if server exists
        const server = await Server.findById(serverId);
        if (!server) {
            return res.status(404).json({
                success: false,
                message: 'Server not found'
            });
        }

        // Check if user is already a member
        const existingMember = await ServerMember.findOne({
            server: serverId,
            user: userId
        });

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'Already a member of this server'
            });
        }

        // Add user to server members
        server.members.push(userId);
        await server.save();

        // Create server member record
        const serverMember = new ServerMember({
            server: serverId,
            user: userId,
            role: 'member'
        });

        await serverMember.save();

        res.status(200).json({
            success: true,
            message: 'Joined server successfully'
        });
    } catch (error) {
        console.error('Join server error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get server channels
route.get('/:serverId/channels', async (req, res) => {
    try {
        const { serverId } = req.params;
        const userId = req.user.id;

        // Check if user is a member of the server
        const membership = await ServerMember.findOne({
            server: serverId,
            user: userId
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this server'
            });
        }

        // Get all channels for the server
        const channels = await Channel.find({ server: serverId })
            .select('_id name type description')
            .lean();

        const formattedChannels = channels.map(channel => ({
            id: channel._id,
            name: channel.name,
            type: channel.type,
            description: channel.description
        }));

        res.status(200).json({
            success: true,
            channels: formattedChannels
        });
    } catch (error) {
        console.error('Get channels error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch channels'
        });
    }
});

// Create a channel in a server
route.post('/:serverId/channels', async (req, res) => {
    try {
        const { serverId } = req.params;
        const { name, type, description } = req.body;
        const userId = req.user.id;

        // Check if user is admin or owner of the server
        const membership = await ServerMember.findOne({
            server: serverId,
            user: userId
        });

        if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to create channels'
            });
        }

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Channel name is required'
            });
        }

        const channel = new Channel({
            name: name.trim(),
            type: type || 'text',
            description: description || '',
            server: serverId
        });

        await channel.save();

        res.status(201).json({
            success: true,
            channel: {
                id: channel._id,
                name: channel.name,
                type: channel.type,
                description: channel.description
            }
        });
    } catch (error) {
        console.error('Create channel error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = route;