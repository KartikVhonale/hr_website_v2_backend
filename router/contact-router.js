const express = require('express');
const ContactController = require('../controllers/contact-controller');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');
const router = express.Router();

router
  .route('/')
  .get(verifyToken, requireAdmin, ContactController.getAllContacts)
  .post(ContactController.createContact);

router
  .route('/:id')
  .put(verifyToken, requireAdmin, ContactController.updateContactStatus)
  .delete(verifyToken, requireAdmin, ContactController.deleteContact);

module.exports = router;
