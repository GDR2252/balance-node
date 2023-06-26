const express = require('express');

const router = express.Router();
const tournamentsController = require('../controllers/tournamentController');

router.post('/', tournamentsController.addTournaments);
router.get('/', tournamentsController.fetchTournaments);
router.post('/update', tournamentsController.updateTournaments);
router.delete('/', tournamentsController.deleteTournaments);

module.exports = router;
