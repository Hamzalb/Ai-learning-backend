const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateZod, schemas } = require('../middleware/validateZod');
const ctrl = require('../controllers/principalController');

router.use(protect, authorize('principal'));

router.get('/dashboard', ctrl.getDashboardStats);

router.get('/classrooms', ctrl.getClassrooms);
router.post('/classrooms', validateZod(schemas.createClassroomSchema), ctrl.createClassroom);
router.put('/classrooms/:id', validateZod(schemas.createClassroomSchema.partial()), ctrl.updateClassroom);
router.delete('/classrooms/:id', ctrl.deleteClassroom);
router.post('/classrooms/:id/assign-students', ctrl.assignStudents);
router.post('/classrooms/:id/assign-teacher', ctrl.assignTeacher);
router.get('/classrooms/:id/roster', ctrl.getClassroomRoster);

router.get('/subjects', ctrl.getSubjects);
router.post('/subjects', validateZod(schemas.createSubjectSchema), ctrl.createSubject);
router.put('/subjects/:id', validateZod(schemas.createSubjectSchema.partial()), ctrl.updateSubject);
router.delete('/subjects/:id', ctrl.deleteSubject);

router.get('/schedules', ctrl.getSchedule);
router.post('/schedules', validateZod(schemas.upsertScheduleSchema), ctrl.upsertSchedule);

router.get('/payslips', ctrl.getPayslips);

module.exports = router;
