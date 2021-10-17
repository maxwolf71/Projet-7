// Imports
const fs = require('fs')
const models = require('../models')
const jwtUtils = require('../middleware/auth')

// Constants
const TITLE_LIMIT = 2
const CONTENT_LIMIT = 4
const ITEMS_LIMIT = 50

// Routes
module.exports = {
    createMessage: function (req, res) {
        // Getting auth header
        const headerAuth = req.headers['authorization']
        const userId = jwtUtils.getUserId(headerAuth)

        // constants
        const title = req.body.title
        const content = req.body.content
        const attachement = req.body.file

        if (title == '' || content == '') {
            return res.status(400).json({ 'error': 'missing parameters' })
        }

        /*if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
            return res.status(400).json({ 'error': 'invalid parameters' })
        }*/

        models.User.findOne({
            where: { id: userId }
        })
        .then(userFound => {
            if (userFound) {
                if (req.file == null) {
                    models.Message.create({
                        title: title,
                        content: content,
                        attachement: 0,
                        likes: 0,
                        UserId: userFound.id
                    })
                    .then(newMessage => res.status(201).json(newMessage))
                    .catch(err => res.status(404).json({ error: 'user not found' }))
                } else {
                    models.Message.create({
                        title: title,
                        content: content,
                        attachement: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
                        likes: 0,
                        UserId: userFound.id
                    })
                    .then(newMessage => res.status(201).json(newMessage))
                    .catch(err => res.status(404).json({ error: 'user not found' }))
                }
            }
        })
        .catch(error => res.status(500).json({ error: 'unable to verify user' }))
    },

    listMessages: function (req, res) {
        const fields = req.query.fields
        const limit = parseInt(req.query.limit)
        const offset = parseInt(req.query.offset)
        const order = req.query.order

        if (limit > ITEMS_LIMIT) {
            limit = ITEMS_LIMIT
        }

        models.Message.findAll({
            order: [(order != null) ? order.split(':') : ['createdAt', 'ASC']],
            attributes: (fields !== '*' && fields != null) ? fields.split(',') : null,
            limit: (!isNaN(limit)) ? limit : null,
            offset: (!isNaN(offset)) ? offset : null,
            include: [{
                model: models.User,
                attributes: ['firstName', 'lastName']
            }]
        })
            .then(function (messages) {
                if (messages) {
                    res.status(200).json(messages)
                } else {
                    res.status(404).json({ "error": "no messages found" })
                }
            }).catch(function (err) {
                console.log(err)
                res.status(500).json({ "error": "invalid fields" })
            })
    },

    deleteMessage: function (req, res) {
        let headerAuth = req.headers['authorization']
        let userId = jwtUtils.getUserId(headerAuth)

        main()

        async function main() {

            let isAdmin = await isAdmin2()

            if (userId < 1)
                return res.status(400).json({ 'error': 'Wrong token' })

            if (isAdmin || userId >= 1) {

                models.Message.findOne({ where: { id: req.params.id } })
                    .then(mess => {
                        if (mess.attachement != null) { // If there is an attachment
                            const filename = mess.attachement.split('/images/')[1]
                            fs.unlink(`images/${filename}`, (err) => {
                                if (err) {
                                    console.log("failed to delete local image:" + err)
                                } else {
                                    console.log('successfully deleted local image')
                                }
                            })
                        } else { }
                        models.Message.destroy({
                            attributes: ['title', 'content', 'attachement'],
                            where: { id: req.params.id }
                        }).then(function (mess) {
                            if (mess) {
                                res.status(201).json({ "success": "Message deleted" })
                            } else {
                                res.status(404).json({ 'error': 'Message not found' })
                            }
                        }).catch(function (err) {
                            res.status(500).json({ 'error': 'cannot fetch message' })
                        })
                    })
            }
        }
        function isAdmin2() {
            return models.User.findOne({ attributes: ['isAdmin'], where: { id: userId } })
        } 

    }
}