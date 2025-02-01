const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const axios = require('axios');
const cors = require('cors'); // Add this line
const app = express();
const MONGODB_URI = 'mongodb://localhost:27017/my-video-platform';
const JWT_SECRET = 'mysecretkey';
const PORT = 3000;
const AUTH0_DOMAIN = 'dev-bv8qwtkgzlety263.us.auth0.com';
const AUTH0_CLIENT_ID = 'iuw5VrLAZldpEmaU14tAqqbgf0U8AkWl';
const AUTH0_CLIENT_SECRET = 'UU0W__12LrqCaWgaBjstXfKn2pbB5HSOEM18UB-Ift699Mfl2n0VBFdbZQ-pG05c';
const AUTH0_AUDIENCE = 'https://api.egyptianmemehub.com';

app.use(cors({
    origin: 'https://egyptianmemehub.netlify.app', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })); // Add this line to enable CORS for all routes
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/downloads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => { console.log('Connected to MongoDB') })
    .catch(err => { console.error('Error connecting to MongoDB:', err) });

const userSchema = new mongoose.Schema({
    fullname: String,
    username: String,
    email: String,
    phone: String,
    password: String,
    isAdmin: { type: Boolean, default: false },
    googleId: String,
    facebookId: String,
    auth0Id: String
});

const videoTitleSchema = new mongoose.Schema({
    videoFilename: String,
    title: String
});

const videoDescriptionSchema = new mongoose.Schema({
    videoFilename: String,
    description: String
});

const User = mongoose.model('User', userSchema);
const VideoTitle = mongoose.model('VideoTitle', videoTitleSchema);
const VideoDescription = mongoose.model('VideoDescription', videoDescriptionSchema);

passport.use(new GoogleStrategy({
    clientID: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, function (accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
    });
}));

passport.use(new FacebookStrategy({
    clientID: AUTH0_CLIENT_ID,
    clientSecret: AUTH0_CLIENT_SECRET,
    callbackURL: "/auth/facebook/callback"
}, function (accessToken, refreshToken, profile, done) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return done(err, user);
    });
}));

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('Access denied. No token provided.');
    const token = authHeader.split(' ')[1];
    try {
        const response = await axios.get(`https://${AUTH0_DOMAIN}/userinfo`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        req.user = response.data;
        next();
    } catch (err) {
        res.status(401).send('Invalid token.');
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

app.use(passport.initialize());

app.post('/register', async (req, res) => {
    try {
        const { fullname, username, email, phone, password } = req.body;
        const newUser = new User({ fullname, username, email, phone, password });
        await newUser.save();
        res.status(200).send('User registered successfully.');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).send('Invalid credentials.');
        if (user.password !== password) return res.status(401).send('Invalid credentials.');
        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET);
        res.status(200).send({ token });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/upload', authenticate, upload.single('video'), (req, res) => {
    console.log(`Uploaded file: ${req.file.originalname}`);
    res.status(200).send(`Video uploaded successfully: ${req.file.originalname}`);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    const token = jwt.sign({ id: req.user._id, isAdmin: req.user.isAdmin }, JWT_SECRET);
    res.redirect('/index.html?token=' + token);
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
    const token = jwt.sign({ id: req.user._id, isAdmin: req.user.isAdmin }, JWT_SECRET);
    res.redirect('/index.html?token=' + token);
});

app.get('/videos', (req, res) => {
    const videoDirectory = path.join(__dirname, 'uploads');
    fs.readdir(videoDirectory, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading directory');
        }
        const videoFiles = files.map(file => ({ filename: file, url: `/uploads/${file}` }));
        res.status(200).json(videoFiles);
    });
});

app.get('/videos/:filename', (req, res) => {
    const { filename } = req.params;
    const videoPath = path.join(__dirname, 'uploads', filename);
    const videoExtension = path.extname(filename).toLowerCase();
    const mimeType = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg' }[videoExtension];
    if (mimeType) {
        res.setHeader('Content-Type', mimeType);
        res.sendFile(videoPath);
    } else {
        res.status(415).send('Unsupported Media Type');
    }
});

app.get('/title/:filename', async (req, res) => {
    try {
        const title = await VideoTitle.findOne({ videoFilename: req.params.filename });
        res.status(200).json(title || { title: '' });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/title/:filename', authenticate, async (req, res) => {
    try {
        let videoTitle = await VideoTitle.findOne({ videoFilename: req.params.filename });
        if (videoTitle) {
            videoTitle.title = req.body.title;
        } else {
            videoTitle = new VideoTitle({ videoFilename: req.params.filename, title: req.body.title });
        }
        await videoTitle.save();
        res.status(200).send('Title saved successfully.');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/description/:filename', async (req, res) => {
    try {
        const description = await VideoDescription.findOne({ videoFilename: req.params.filename });
        res.status(200).json(description || { description: '' });
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/description/:filename', authenticate, async (req, res) => {
    try {
        let videoDescription = await VideoDescription.findOne({ videoFilename: req.params.filename });
        if (videoDescription) {
            videoDescription.description = req.body.description;
        } else {
            videoDescription = new VideoDescription({
                videoFilename: req.params.filename,
                description: req.body.description
            });
        }
        await videoDescription.save();
        res.status(200).send('Description saved successfully.');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/comments', authenticate, async (req, res) => {
    try {
        const newComment = new Comment({
            videoFilename: req.body.videoFilename,
            username: req.user.username,
            comment: req.body.comment
        });
        await newComment.save();
        res.status(200).send('Comment added successfully.');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/comments/:videoFilename', async (req, res) => {
    try {
        const comments = await Comment.find({ videoFilename: req.params.videoFilename }).sort({ timestamp: -1 });
        res.status(200).json(comments);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/like', authenticate, async (req, res) => {
    try {
        const existingInteraction = await VideoInteraction.findOne({
            videoFilename: req.body.videoFilename,
            userId: req.user.id
        });
        if (existingInteraction) {
            if (existingInteraction.interactionType === 'like') {
                return res.status(400).send('You have already liked this video.');
            } else {
                existingInteraction.interactionType = 'like';
                await existingInteraction.save();
            }
        } else {
            const newInteraction = new VideoInteraction({
                videoFilename: req.body.videoFilename,
                userId: req.user.id,
                interactionType: 'like'
            });
            await newInteraction.save();
        }
        res.status(200).send('Video liked successfully.');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/dislike', authenticate, async (req, res) => {
    try {
        const existingInteraction = await VideoInteraction.findOne({
            videoFilename: req.body.videoFilename,
            userId: req.user.id
        });
        if (existingInteraction) {
            if (existingInteraction.interactionType === 'dislike') {
                return res.status(400).send('You have already disliked this video.');
            } else {
                existingInteraction.interactionType = 'dislike';
                await existingInteraction.save();
            }
        } else {
            const newInteraction = new VideoInteraction({
                videoFilename: req.body.videoFilename,
                userId: req.user.id,
                interactionType: 'dislike'
            });
            await newInteraction.save();
        }
        res.status(200).send('Video disliked successfully.');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.put('/comments/:id', authenticate, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).send('Comment not found.');
        if (comment.username !== req.user.username) return res.status(403).send('Unauthorized.');
        comment.comment = req.body.comment;
        await comment.save();
        res.status(200).send('Comment updated successfully.');
    } catch (err) {
        res.status(500).send(err);
    }
});

app.delete('/comments/:id', authenticate, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).send('Comment not found.');
        if (comment.username !== req.user.username) return res.status(403).send('Unauthorized.');
        await comment.remove();
        res.status(200).send('Comment deleted successfully.');
    } catch (err) {
        res.status(500).send(err);
    }
});

const port = PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
