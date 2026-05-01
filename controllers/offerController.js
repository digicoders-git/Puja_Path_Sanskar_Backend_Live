const Offer = require("../models/Offer");

// Admin - Offer banao
const createOffer = async (req, res) => {
  try {
    const { title, description, discountType, discountValue, applicableTo, pujas, minAmount, priority, startDate, endDate } = req.body;

    if (!title || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ message: "title, discountType, discountValue, startDate, endDate required hain", success: false });
    }

    if (applicableTo === "specific" && (!pujas || pujas.length === 0)) {
      return res.status(400).json({ message: "Specific offer ke liye kam se kam ek puja select karo", success: false });
    }

    const offer = await Offer.create({
      title,
      description: description || "",
      discountType,
      discountValue,
      applicableTo: applicableTo || "all",
      pujas: applicableTo === "specific" ? pujas : [],
      minAmount: minAmount || 0,
      priority: priority || 0,
      startDate,
      endDate,
    });

    res.status(201).json({ success: true, message: "Offer created successfully", offer });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Public - Saare active offers dekho
const getAllOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate("pujas", "pujaType image")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: offers.length, offers });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Admin - Saare offers (inactive bhi)
const getAllOffersAdmin = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("pujas", "pujaType image")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: offers.length, offers });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Public - Kisi specific puja ke liye best offer priority se select karo
const getOffersByPuja = async (req, res) => {
  try {
    const { pujaId } = req.params;
    const now = new Date();

    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { applicableTo: "all" },
        { applicableTo: "specific", pujas: pujaId },
      ],
    });

    if (offers.length === 0) {
      return res.status(200).json({ success: true, bestOffer: null });
    }

    // Jo offer ki priority zyada ho woh lagega
    const bestOffer = offers.reduce((best, curr) =>
      curr.priority > best.priority ? curr : best
    );

    res.status(200).json({ success: true, bestOffer });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Admin - Offer update karo
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found", success: false });

    const fields = ["title", "description", "discountType", "discountValue", "applicableTo", "pujas", "minAmount", "priority", "startDate", "endDate"];
    fields.forEach((f) => { if (req.body[f] !== undefined) offer[f] = req.body[f]; });

    await offer.save();
    res.status(200).json({ success: true, message: "Offer updated successfully", offer });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Admin - Offer Active/Inactive toggle
const toggleOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found", success: false });

    offer.isActive = !offer.isActive;
    await offer.save();
    res.status(200).json({ success: true, message: `Offer ${offer.isActive ? "activated" : "deactivated"}`, isActive: offer.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Admin - Offer delete karo
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found", success: false });

    await offer.deleteOne();
    res.status(200).json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

module.exports = {
  createOffer,
  getAllOffers,
  getAllOffersAdmin,
  getOffersByPuja,
  updateOffer,
  toggleOffer,
  deleteOffer,
};
