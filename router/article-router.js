const express = require('express');
const ArticleController = require('../controllers/article-controller');
const { verifyToken, requireAdmin, requireEmployer } = require('../middleware/auth-middleware');
const { articleValidations } = require('../middleware/validation-middleware');
const { uploadLimiter } = require('../middleware/security-middleware');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const router = express.Router();

const upload = multer({ storage });

router
  .route('/')
  .get(ArticleController.getAllArticles)
  .post(verifyToken, requireEmployer, uploadLimiter, upload.single('image'), articleValidations.create, ArticleController.createArticle);

router
  .route('/:id')
  .get(ArticleController.getArticle)
  .put(verifyToken, requireEmployer, articleValidations.update, ArticleController.updateArticle)
  .delete(verifyToken, requireAdmin, ArticleController.deleteArticle);

router.put('/:id/like', verifyToken, ArticleController.likeArticle);
router.put('/:id/dislike', verifyToken, ArticleController.dislikeArticle);

router.get('/categories', ArticleController.getCategories);

router.get('/author/:authorId', ArticleController.getArticlesByAuthor);

module.exports = router;
