const Article = require('../models/Article');

class ArticleController {
  // @desc    Get all articles
  // @route   GET /api/articles
  // @access  Public
  static async getAllArticles(req, res) {
    try {
      const articles = await Article.find().populate('author', 'name');
      res.status(200).json({
        success: true,
        count: articles.length,
        data: articles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Get single article
  // @route   GET /api/articles/:id
  // @access  Public
  static async getArticle(req, res) {
    try {
      const article = await Article.findById(req.params.id).populate('author', 'name');

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      res.status(200).json({
        success: true,
        data: article
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Create an article
  // @route   POST /api/articles
  // @access  Private (Employer)
  static async createArticle(req, res) {
    try {
      const { title, content, category, date, readTime } = req.body;
      const author = req.user.userId;
      
      let image = null;
      if (req.file) {
        // The image is uploaded to Cloudinary via multer middleware
        // req.file.path contains the URL from Cloudinary
        image = req.file.path;
      }

      const article = await Article.create({
        title,
        content,
        image,
        category,
        author,
        date,
        readTime
      });

      res.status(201).json({
        success: true,
        data: article
      });
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Update an article
  // @route   PUT /api/articles/:id
  // @access  Private (Employer/Admin)
  static async updateArticle(req, res) {
    try {
      let article = await Article.findById(req.params.id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // Make sure user is article owner or admin
      if (article.author.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to update this article'
        });
      }

      const { title, content, category } = req.body;
      
      let image = article.image;
      if (req.file) {
        image = req.file.path;
      }

      article.title = title;
      article.content = content;
      article.category = category;
      article.image = image;

      await article.save();

      res.status(200).json({
        success: true,
        data: article
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Delete an article
  // @route   DELETE /api/articles/:id
  // @access  Private (Employer/Admin)
  static async deleteArticle(req, res) {
    try {
      const article = await Article.findById(req.params.id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // Make sure user is article owner or admin
      if (article.author.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to delete this article'
        });
      }

      await article.remove();

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

  // @desc    Like an article
  // @route   PUT /api/articles/:id/like
  // @access  Private
  static async likeArticle(req, res) {
    try {
      const article = await Article.findById(req.params.id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // Check if already liked
      if (article.likes.includes(req.user.userId)) {
        // Unlike
        article.likes = article.likes.filter(
          (userId) => userId.toString() !== req.user.userId
        );
      } else {
        // Like
        article.likes.push(req.user.userId);
        // Remove from dislikes if present
        article.dislikes = article.dislikes.filter(
          (userId) => userId.toString() !== req.user.userId
        );
      }

      await article.save();
      res.status(200).json({
        success: true,
        data: article
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Dislike an article
  // @route   PUT /api/articles/:id/dislike
  // @access  Private
  static async dislikeArticle(req, res) {
    try {
      const article = await Article.findById(req.params.id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        });
      }

      // Check if already disliked
      if (article.dislikes.includes(req.user.userId)) {
        // Undislike
        article.dislikes = article.dislikes.filter(
          (userId) => userId.toString() !== req.user.userId
        );
      } else {
        // Dislike
        article.dislikes.push(req.user.userId);
        // Remove from likes if present
        article.likes = article.likes.filter(
          (userId) => userId.toString() !== req.user.userId
        );
      }

      await article.save();
      res.status(200).json({
        success: true,
        data: article
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }

  // @desc    Get all categories
  // @route   GET /api/articles/categories
  // @access  Public
  static async getCategories(req, res) {
    try {
      const categories = await Article.distinct('category');
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }
}

module.exports = ArticleController;
