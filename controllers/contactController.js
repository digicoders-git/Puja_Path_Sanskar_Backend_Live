const Contact = require("../models/Contact");

// Submit Contact Form
const createContact = async (req, res) => {
  const { fullName, phone, email, subject, message } = req.body;
  try {
    const contact = await Contact.create({ fullName, phone, email, subject, message });
    res.status(201).json({ message: "Contact form submitted successfully", contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Contacts (Admin ke liye)
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Contact
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Contact
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    await contact.deleteOne();
    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createContact, getAllContacts, getContactById, deleteContact };
