// Imports
const bcrypt = require('bcrypt')
const jwtUtils = require('../utils/jwt.utils')
const models = require('../models')
const asyncLib = require('async')

// Constants
const EMAIL_REGEX = /^(([^<>()\[\]\\.,:\s@"]+(\.[^<>()\[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const PASSWORD_REGEX = /^(?=.*\d).{4,8}$/

// Routes
module.exports = {

  // REGISTER ***********************************************************************

  createAccount: function (req, res) {

    // Params
    const email = req.body.email
    const firstName = req.body.firstName
    const lastName = req.body.lastName
    const password = req.body.password
    const bio = req.body.bio

    if (email == null || firstName == null || lastName == null || password == null) {
      return res.status(400).json({ 'error': 'missing parameters' })
    }

    if (firstName.length >= 15 || firstName.length <= 2) {
      return res.status(400).json({ 'error': 'wrong username (must be length 3 - 16)' })
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ 'error': 'email is not valid' })
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ 'error': 'password invalid (length 4 - 8 characters & include 1 number at least)' })
    }

    models.User.findOne({
      attributes: ['email'],
      where: { email: email }
    })
      .then(function (userFound) {
        if (!userFound) {
          bcrypt.hash(password, 5, function (err, bcryptedPassword) {
            const newUser = models.User.create({
              email: email,
              firstName: firstName,
              lastName: lastName,
              password: bcryptedPassword,
              bio: bio,
              isAdmin: 0
            })
          })
            .then(function (newUser) {
              return res.status(201).json({
                'userId': newUser.id
              })
            })
            .catch(function (err) {
              return res.status(500).json({ 'error': 'cannot add user' })
            })
        } else {
          return res.status(409).json({ 'error': 'user already exists' })
        }
      })
      .catch(function (err) {
        return res.status(500).json({ 'error': 'unable to verify user' })
      })
  },

  // LOGIN ***********************************************************************
  login: function (req, res) {

    // Params
    const email = req.body.email
    const password = req.body.password

    if (email == null || password == null) {
      return res.status(400).json({ 'error': 'missing parameters' })

    }

    models.User.findOne({
      where: { email: email }
    })
      .then(function (userFound) {
        if (userFound) {
          bcrypt.compare(password, userFound.password, function (errBycrypt, resBycrypt) {
            if (resBycrypt) {
              return res.status(200).json({
                'userId': userFound.id,
                'token': jwtUtils.generateTokenForUser(userFound)
              })
            } else {
              return res.status(403).json({ 'error': 'invalid password' })
            }
          })
        } else {
          return res.status(404).json({ 'error': 'user doesn\'t exist in DB' })
        }
      })
      .catch(function (err) {
        return res.status(500).json({ 'error': 'unable to verify user' })
      })
  },

 // GET USER PROFILE ***********************************************************************
  getUserInfos: function(req, res) {
    const headerAuth = req.headers['authorization']
    const userId = jwtUtils.getUserId(headerAuth)

    if (userId < 0) 
      return res.status(400).json({ 'error': 'wrong token' })
      
    models.User.findOne({
      attributes: ['id', 'email', 'firstName', 'lastName', 'bio'],
      where: { id: userId }
    })
      .then(function(user) {
        if (user) {
         res.status(201).json(user)
        } else {
          res.status(404).json({ 'error': 'user not found' })
        }
      })
      .catch(function(err) {
        res.status(500).json({ 'error': 'cannot fetch user' })
      })
  },
  // UPDATE USER PROFILE ***********************************************************************
  updateUserInfos: function(req, res) {
    const headerAuth = req.headers['authorization']
    const userId     = jwtUtils.getUserId(headerAuth)

    // Params
    const bio = req.body.bio

    asyncLib.waterfall([
      function (done) {
        models.User.findOne({
          attributes: ['id', 'bio'],
          where: { id: userId }
        })
        .then(function (userFound) {
          done(null, userFound);
        })
          .catch(function (err) {
            return res.status(500).json({ 'error': 'unable to verify user' });
          })
      },
      function (userFound, done) {
        if (userFound) {
          userFound.update({
            bio: (bio ? bio : userFound.bio)
          }).then(function () {
            done(userFound);
          }).catch(function (err) {
            return res.status(500).json({ 'error': 'cannot update user' });
          }) 
        } else {
          return res.status(404).json({ 'error': 'user not found' });
        }
      },
    ], function (userFound) {
      if (userFound) {
        return res.status(201).json(userFound)
      } else {
        return res.status(500).json({ 'error': 'cannot update user profile' })
      }
    })
  } 
}

