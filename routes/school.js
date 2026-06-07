const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateZod, schemas } = require('../middleware/validateZod');
const ctrl = require('../controllers/schoolController');

router.use(protect, authorize('school'));

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/profile', ctrl.getSchoolProfile);
router.put('/profile', ctrl.updateSchoolProfile);

router.get('/teachers', ctrl.getTeachers);
router.post('/teachers', validateZod(schemas.schoolCreateMemberSchema), ctrl.createTeacher);
router.put('/teachers/:id', validateZod(schemas.schoolCreateMemberSchema.partial()), ctrl.updateTeacher);
router.patch('/teachers/:id/toggle', ctrl.toggleTeacher);

router.get('/students', ctrl.getStudents);
router.post('/students', validateZod(schemas.schoolCreateMemberSchema), ctrl.createStudent);
router.put('/students/:id', validateZod(schemas.schoolCreateMemberSchema.partial()), ctrl.updateStudent);
router.patch('/students/:id/toggle', ctrl.toggleStudent);

router.get('/principals', ctrl.getPrincipals);
router.post('/principals', validateZod(schemas.schoolCreateMemberSchema), ctrl.createPrincipal);
router.patch('/principals/:id/toggle', ctrl.togglePrincipal);

module.exports = router;
