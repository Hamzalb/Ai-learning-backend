const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/principalController');

router.use(protect, authorize('principal'));

router.get('/dashboard', ctrl.getDashboardStats);

router.get('/classrooms', ctrl.getClassrooms);
router.post('/classrooms', ctrl.createClassroom);
router.put('/classrooms/:id', ctrl.updateClassroom);
router.delete('/classrooms/:id', ctrl.deleteClassroom);
router.post('/classrooms/:id/assign-students', ctrl.assignStudents);
router.post('/classrooms/:id/assign-teacher', ctrl.assignTeacher);
router.get('/classrooms/:id/roster', ctrl.getClassroomRoster);

router.get('/subjects', ctrl.getSubjects);
router.post('/subjects', ctrl.createSubject);
router.put('/subjects/:id', ctrl.updateSubject);
router.delete('/subjects/:id', ctrl.deleteSubject);

router.get('/schedules', ctrl.getSchedule);
router.post('/schedules', ctrl.upsertSchedule);

module.exports = router;
