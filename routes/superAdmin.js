const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/superAdminController');

router.use(protect, authorize('super_admin'));

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/audit-logs', ctrl.getAuditLogs);

router.get('/schools', ctrl.getSchools);
router.post('/schools', ctrl.createSchool);
router.get('/schools/:id', ctrl.getSchool);
router.put('/schools/:id', ctrl.updateSchool);
router.patch('/schools/:id/toggle', ctrl.toggleSchoolActive);
router.delete('/schools/:id', ctrl.deleteSchool);

router.get('/users', ctrl.getUsers);
router.post('/users', ctrl.createUser);
router.get('/users/:id', ctrl.getUser);
router.put('/users/:id', ctrl.updateUser);
router.patch('/users/:id/toggle', ctrl.toggleUserActive);
router.patch('/users/:id/transfer', ctrl.transferTeacher);

module.exports = router;
