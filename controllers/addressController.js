const Address = require("../models/Address");

// @desc    Add a new address
// @route   POST /api/addresses
// @access  Private
const addAddress = async (req, res) => {
  try {
    const { type, houseFlatNo, streetArea, city, state, pincode, isDefault } = req.body;

    // If this is set to default, unset other defaults for this user
    if (isDefault) {
      await Address.updateMany({ user: req.user._id || req.user.id }, { isDefault: false });
    }

    const address = new Address({
      user: req.user._id || req.user.id,
      type: type || "Home",
      houseFlatNo,
      streetArea,
      city,
      state,
      pincode,
      isDefault: isDefault || false,
    });

    const createdAddress = await address.save();

    // If it's the first address, make it default automatically
    if (!isDefault) {
      const addressCount = await Address.countDocuments({ user: req.user._id || req.user.id });
      if (addressCount === 1) {
        createdAddress.isDefault = true;
        await createdAddress.save();
      }
    }

    res.status(201).json({ success: true, address: createdAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's addresses
// @route   GET /api/addresses
// @access  Private
const getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id || req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an address
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = async (req, res) => {
  try {
    const { type, houseFlatNo, streetArea, city, state, pincode, isDefault } = req.body;

    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Make sure user owns the address
    if (address.user.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user._id || req.user.id }, { isDefault: false });
    }

    address.type = type || address.type;
    address.houseFlatNo = houseFlatNo || address.houseFlatNo;
    address.streetArea = streetArea || address.streetArea;
    address.city = city || address.city;
    address.state = state || address.state;
    address.pincode = pincode || address.pincode;
    
    if (isDefault !== undefined) {
      address.isDefault = isDefault;
    }

    const updatedAddress = await address.save();
    res.json({ success: true, address: updatedAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (address.user.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    await address.deleteOne();

    // If deleted address was default, make another one default
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ user: req.user._id || req.user.id });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    res.json({ success: true, message: "Address removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
};
