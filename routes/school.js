const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/schoolController');

router.use(protect, authorize('school'));

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/profile', ctrl.getSchoolProfile);
router.put('/profile', ctrl.updateSchoolProfile);

router.get('/teachers', ctrl.getTeachers);
router.post('/teachers', ctrl.createTeacher);
router.put('/teachers/:id', ctrl.updateTeacher);
router.patch('/teachers/:id/toggle', ctrl.toggleTeacher);

router.get('/students', ctrl.getStudents);
router.post('/students', ctrl.createStudent);
router.put('/students/:id', ctrl.updateStudent);
router.patch('/students/:id/toggle', ctrl.toggleStudent);

router.get('/principals', ctrl.getPrincipals);
router.post('/principals', ctrl.createPrincipal);
router.patch('/principals/:id/toggle', ctrl.togglePrincipal);

module.exports = router;
