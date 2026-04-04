const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");

// Add Customer
router.post("/add-customer", customerController.addCustomer);

// Delete Customer
router.delete("/delete-customer/:id", customerController.deleteCustomer);

// Update Customer
router.put("/update-customer/:id", customerController.updateCustomer);

// Get All Customers
router.get("/customers", customerController.getAllCustomers);

module.exports = router;