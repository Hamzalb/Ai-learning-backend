const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/studentController');

router.use(protect, authorize('student'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/documents', ctrl.getDocuments);
router.get('/grades', ctrl.getGrades);
router.get('/quizzes', ctrl.getQuizzes);
router.post('/quizzes/:id/submit', ctrl.submitQuiz);
router.get('/attendance', ctrl.getAttendance);
router.get('/homework', ctrl.getHomework);
router.post('/homework/:id/submit', ctrl.submitHomework);
router.get('/payments', ctrl.getPayments);
router.get('/schedule', ctrl.getSchedule);

module.exports = router;
