const Contact = require('../models/Contact');

class ContactController {
  // @desc    Get all contact submissions
  // @route   GET /api/contacts
  // @access  Private (Admin)
  static async getAllContacts(req, res) {
    try {
      const contacts = await Contact.find();
      res.status(200).json({
        success: true,
        count: contacts.length,
        data: contacts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Create a contact submission
  // @route   POST /api/contacts
  // @access  Public
  static async createContact(req, res) {
    try {
      const contact = await Contact.create(req.body);
      res.status(201).json({
        success: true,
        data: contact
      });
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }

  // @desc    Update contact submission status
  // @route   PUT /api/contacts/:id
  // @access  Private (Admin)
  static async updateContactStatus(req, res) {
    try {
      const { id } = req.params;
      const { isResolved } = req.body;

      const updatedContact = await Contact.findByIdAndUpdate(
        id,
        { isResolved },
        { new: true, runValidators: true }
      );

      if (!updatedContact) {
        return res.status(404).json({
          success: false,
          message: 'Contact submission not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedContact
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Delete a contact submission
  // @route   DELETE /api/contacts/:id
  // @access  Private (Admin)
  static async deleteContact(req, res) {
    try {
      const { id } = req.params;
      const contact = await Contact.findByIdAndDelete(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact submission not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }
}

module.exports = ContactController;
