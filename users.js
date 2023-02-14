var express = require('express');
var router = express.Router();
var models = require('../models');
var authService = require('../services/auth');


/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
  res.render('signup');
});

//View the signup page
router.get('/signup', function (req, res, next) {
  res.render('signup');
});

// Create new user if one doesn't exist
router.post('/signup', function (req, res, next) {
  models.users
    .findOrCreate({
      where: {
        Username: req.body.username
      },
      defaults: {
        FirstName: req.body.firstName,
        LastName: req.body.lastName,
        Email: req.body.email,
        Password: authService.hashPassword(req.body.password)
      }
    })
    .spread(function (result, created) {
      if (created) {
        res.send('User successfully created');
      } else {
        res.send('This user already exists');
      }
    });
});

//View the login page
router.get('/login', function (req, res, next) {
  res.render('login');
});

// Login user and return JWT as cookie
router.post('/login', function (req, res, next) {
  models.users.findOne({
    where: {
      Username: req.body.username
    }
  }).then(user => {
    if (!user) {
      console.log('User not found')
      return res.status(401).json({
        message: "Login Failed"
      });
    } else {
      let passwordMatch = authService.comparePasswords(req.body.password, user.Password);
      if (passwordMatch) {
        let token = authService.signUser(user);
        res.cookie('jwt', token);
        res.redirect('/users/profile');
      } else {
        console.log('Wrong password');
        res.send('Wrong password');
      }
    }
  });
});

//View the profile page
router.get('/profile', function (req, res, next) {
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token)
      .then(user => {
        if (user) {
          res.render('profile', {user: (user)});
        } else {
          res.status(401);
          res.send('Invalid authentication token');
        }
      });
  } else {
    res.status(401);
    res.send('Must be logged in');
  }
});

//Make a post as a user
router.post('/profile', function (req, res, next) {
  models.posts
    .create({
      defaults: {
        PostTitle: req.body.postTitle,
        PostBody: req.body.postBody
      }
    })
    .spread(function (result, created) {
      if (created) {
        res.send('Post successfully created');
      } else {
        res.send('Post failed try again');
      }
    });
});


//View the logout page
router.get('/logout', function (req, res, next) {
  res.cookie('jwt', "", { expires: new Date(0) });
  res.send('Logged out');
});

module.exports = router;
