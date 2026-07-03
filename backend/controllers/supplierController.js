import supplierModel from "../models/supplierModel.js";

// Add supplier
const addSupplier = async (req, res) => {
  const { name, phone, email, address } = req.body;

  if (!name || !phone || !email || !address) {
    return res.json({ success: false, message: "All fields are required" });
  }

  try {
    const supplier = new supplierModel({
      name,
      phone,
      email,
      address
    });
    await supplier.save();
    res.json({ success: true, message: "Supplier Added Successfully", data: supplier });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error adding supplier" });
  }
};

// List suppliers
const listSuppliers = async (req, res) => {
  try {
    const suppliers = await supplierModel.find({});
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching suppliers" });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  const { id, name, phone, email, address } = req.body;

  if (!id) {
    return res.json({ success: false, message: "Supplier ID is required" });
  }

  try {
    const supplier = await supplierModel.findById(id);
    if (!supplier) {
      return res.json({ success: false, message: "Supplier not found" });
    }

    const updatedData = {
      name: name ?? supplier.name,
      phone: phone ?? supplier.phone,
      email: email ?? supplier.email,
      address: address ?? supplier.address,
    };

    const updatedSupplier = await supplierModel.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: "Supplier Updated Successfully", data: updatedSupplier });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error updating supplier" });
  }
};

// Remove supplier
const removeSupplier = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.json({ success: false, message: "Supplier ID is required" });
  }

  try {
    const supplier = await supplierModel.findById(id);
    if (!supplier) {
      return res.json({ success: false, message: "Supplier not found" });
    }

    await supplierModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Supplier Removed Successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error removing supplier" });
  }
};

export { addSupplier, listSuppliers, updateSupplier, removeSupplier };
