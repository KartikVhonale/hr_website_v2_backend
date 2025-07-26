const Team = require('../models/Team');

class TeamController {
  // @desc    Get all team members
  // @route   GET /api/team
  // @access  Public
  static async getAllTeamMembers(req, res) {
    try {
      const team = await Team.find();
      res.status(200).json({
        success: true,
        count: team.length,
        data: team
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Create a team member
  // @route   POST /api/team
  // @access  Private (Admin)
  static async createTeamMember(req, res) {
    try {
      const teamMember = await Team.create(req.body);
      res.status(201).json({
        success: true,
        data: teamMember
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Update a team member
  // @route   PUT /api/team/:id
  // @access  Private (Admin)
  static async updateTeamMember(req, res) {
    try {
      let teamMember = await Team.findById(req.params.id);

      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      teamMember = await Team.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: teamMember
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Delete a team member
  // @route   DELETE /api/team/:id
  // @access  Private (Admin)
  static async deleteTeamMember(req, res) {
    try {
      const teamMember = await Team.findById(req.params.id);

      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      await teamMember.remove();

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }
}

module.exports = TeamController;
