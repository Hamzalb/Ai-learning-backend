const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/teacherController');

router.use(protect, authorize('teacher'));

router.get('/dashboard', ctrl.getDashboardStats);

router.get('/classes', ctrl.getMyClasses);
router.get('/classes/:id/roster', ctrl.getClassRoster);

router.get('/grades', ctrl.getGrades);
router.post('/grades', ctrl.createGrade);
router.put('/grades/:id', ctrl.updateGrade);
router.delete('/grades/:id', ctrl.deleteGrade);

router.get('/documents', ctrl.getDocuments);
router.post('/documents', ctrl.uploadDocument);
router.delete('/documents/:id', ctrl.deleteDocument);

router.get('/quizzes', ctrl.getQuizzes);
router.post('/quizzes', ctrl.createQuiz);
router.put('/quizzes/:id', ctrl.updateQuiz);
router.delete('/quizzes/:id', ctrl.deleteQuiz);
router.get('/quizzes/:id/submissions', ctrl.getQuizSubmissions);

router.get('/homework', ctrl.getHomework);
router.post('/homework', ctrl.createHomework);

router.get('/payslips', ctrl.getPayslips);

module.exports = router;
