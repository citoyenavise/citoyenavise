/**
 * Reports Routes
 */

const express = require("express");
const router = express.Router();

const auth = require("../../middlewares/auth");
const { requirePermission } = require("../../middlewares/adminAuth");
const { PERMISSIONS } = require("../admin/permissions");

// List reports
router.get(
  "/",
  auth,
  requirePermission(PERMISSIONS.MANAGE_REPORTS),
  (req, res) => {
    res.json({ message: "TODO: Implement list reports" });
  }
);

// Resolve report
router.post(
  "/:id/resolve",
  auth,
  requirePermission(PERMISSIONS.MANAGE_REPORTS),
  (req, res) => {
    res.json({ message: "TODO: Implement resolve report" });
  }
);

module.exports = router;
