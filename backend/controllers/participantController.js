const Participant = require('../models/Participant');
const bcrypt = require('bcrypt');

// Get Profile
const getProfile = async (req, res) => {
    try {
        const user = await Participant.findById(req.user.id)
            .select('-password')
            .populate('followedOrganizers', 'organizerName firstName lastName');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, contactNumber, collegeName, interests } = req.body;
        const user = await Participant.findById(req.user.id);

        if (user) {
            user.firstName = firstName || user.firstName;
            user.lastName = lastName || user.lastName;
            user.contactNumber = contactNumber || user.contactNumber;
            // Only update college/org if not restricted (Assuming editable for now based on reqs)
            user.collegeName = collegeName || user.collegeName;
            if (interests) user.interests = interests; // Array of strings

            // For Organizers
            if (user.role === 'organizer') {
                user.organizerName = req.body.organizerName || user.organizerName;
                user.description = req.body.description || user.description;
                user.category = req.body.category || user.category;
                user.contactEmail = req.body.contactEmail || user.contactEmail;
                user.discordWebhook = req.body.discordWebhook || user.discordWebhook;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                role: updatedUser.role,
                interests: updatedUser.interests
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await Participant.findById(req.user.id);

        if (user && (await bcrypt.compare(currentPassword, user.password))) {
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(400).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Single Organizer (Public)
const getOrganizerById = async (req, res) => {
    try {
        const organizer = await Participant.findById(req.params.id)
            .select('organizerName firstName lastName category description contactEmail role');

        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }
        res.json(organizer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get All Organizers
const getAllOrganizers = async (req, res) => {
    try {
        const organizers = await Participant.find({ role: 'organizer' })
            .select('organizerName firstName lastName category description contactEmail');
        res.json(organizers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Follow/Unfollow Organizer
const toggleFollowOrganizer = async (req, res) => {
    try {
        const organizerId = req.params.id;
        const user = await Participant.findById(req.user.id);

        // Check if organizer exists
        const organizer = await Participant.findById(organizerId);
        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        const isFollowing = user.followedOrganizers.includes(organizerId);

        if (isFollowing) {
            user.followedOrganizers = user.followedOrganizers.filter(id => id.toString() !== organizerId);
            await user.save();
            res.json({ message: 'Unfollowed organizer', isFollowing: false });
        } else {
            user.followedOrganizers.push(organizerId);
            await user.save();
            res.json({ message: 'Followed organizer', isFollowing: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// =============================
// Admin: Create Organizer
// =============================
const createOrganizer = async (req, res) => {
    try {
        const { organizerName, contactNumber } = req.body;

        // Auto-generate email: name_random@felicity.iiit.ac.in
        const slug = organizerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        const email = `${slug}_${randomSuffix}@felicity.iiit.ac.in`;

        // Check if user exists (highly unlikely with random suffix but good practice)
        const userExists = await Participant.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Error creating user, please try again' });
        }

        // Generate random password
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const organizer = await Participant.create({
            firstName: organizerName, // Using firstName as organizer name initially
            lastName: '(Organizer)',
            email,
            password: hashedPassword,
            contactNumber,
            role: 'organizer',
            organizerName: organizerName,
            contactEmail: email, // Default public email to login email
            isVerified: true // Auto-verify admin created accounts
        });

        res.status(201).json({
            message: 'Organizer created successfully',
            organizer: {
                _id: organizer._id,
                email: organizer.email,
                organizerName: organizer.organizerName
            },
            temporaryPassword: randomPassword // Send back RAW password strictly once
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// =============================
// Admin: Delete Organizer
// =============================
const deleteOrganizer = async (req, res) => {
    try {
        const organizer = await Participant.findById(req.params.id);

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        await organizer.deleteOne();
        res.json({ message: 'Organizer removed' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getAllOrganizers,
    getOrganizerById,
    toggleFollowOrganizer,
    createOrganizer,
    deleteOrganizer
};
