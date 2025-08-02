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

  // @desc    Get team member by ID
  // @route   GET /api/team/:id
  // @access  Public
  static async getTeamMemberById(req, res) {
    try {
      const teamMember = await Team.findById(req.params.id);

      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }

      res.status(200).json({
        success: true,
        data: teamMember
      });
    } catch (error) {
      console.error('Get team member by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team member'
      });
    }
  }

  // @desc    Search team members
  // @route   GET /api/team/search
  // @access  Public
  static async searchTeamMembers(req, res) {
    try {
      const {
        q = '',
        department,
        role,
        status = 'active',
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const query = {};

      // Text search
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { position: { $regex: q, $options: 'i' } },
          { department: { $regex: q, $options: 'i' } }
        ];
      }

      // Filters
      if (department) query.department = department;
      if (role) query.role = role;
      if (status) query.status = status;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const teamMembers = await Team.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Team.countDocuments(query);

      res.status(200).json({
        success: true,
        data: teamMembers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Search team members error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search team members'
      });
    }
  }

  // @desc    Get team statistics
  // @route   GET /api/team/stats
  // @access  Private (Admin)
  static async getTeamStats(req, res) {
    try {
      const [
        totalMembers,
        activeMembers,
        departmentStats,
        roleStats
      ] = await Promise.all([
        Team.countDocuments(),
        Team.countDocuments({ status: 'active' }),
        Team.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } }
        ]),
        Team.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalMembers,
          activeMembers,
          departmentStats: departmentStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {}),
          roleStats: roleStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Get team stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team statistics'
      });
    }
  }

  // @desc    Get team departments
  // @route   GET /api/team/departments
  // @access  Public
  static async getTeamDepartments(req, res) {
    try {
      const departments = await Team.distinct('department');

      res.status(200).json({
        success: true,
        data: departments.filter(dept => dept) // Remove null/empty values
      });
    } catch (error) {
      console.error('Get team departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team departments'
      });
    }
  }

  // @desc    Get team roles
  // @route   GET /api/team/roles
  // @access  Public
  static async getTeamRoles(req, res) {
    try {
      const roles = await Team.distinct('role');

      res.status(200).json({
        success: true,
        data: roles.filter(role => role) // Remove null/empty values
      });
    } catch (error) {
      console.error('Get team roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch team roles'
      });
    }
  }
}

module.exports = TeamController;
