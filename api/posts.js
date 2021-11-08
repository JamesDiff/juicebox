const express = require('express');
const postsRouter = express.Router(); //should this be users?

const { getAllPosts, createPost } = require('../db')

const { requireUser } = require('./utils');


postsRouter.post('/', requireUser, async (req, res, next) => {
  const { title, content, tags = "" } = req.body;

  const tagArr = tags.trim().split(/\s+/)
  const postData = {authorId: req.user.id, title, content};

  if (tagArr.length) {
    postData.tags = tagArr;
  }

  try {
    const post = await createPost(postData);
   
    if(post) {
      res.send({post});
    } else {
      next({error: "no post returned"})
    }

  } catch ({ name, message }) {
    next({ name, message });
  }
  
});


postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params;
  const { title, content, tags } = req.body;

  const updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostById(postId);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields);
      res.send({ post: updatedPost })
    } else {
      next({
        name: 'UnauthorizedUserError',
        message: 'You cannot update a post that is not yours'
      })
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});




postsRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");
//what in here?
  next();
})

//const { getAllPosts } = require('../db');

postsRouter.get('/posts', async (req, res) => {  //postsRouter or usersRouter??
    const posts = await getAllPosts();

    res.send({
    posts 
  });
});

module.exports = postsRouter;


postsRouter.delete('/:postId', requireUser, async (req, res, next) => {  //correct page?
  try {
    const post = await getPostById(req.params.postId);

    if (post && post.author.id === req.user.id) {
      const updatedPost = await updatePost(post.id, { active: false });

      res.send({ post: updatedPost });
    } else {
      // if there was a post, throw UnauthorizedUserError, otherwise throw PostNotFoundError
      next(post ? { 
        name: "UnauthorizedUserError",
        message: "You cannot delete a post which is not yours"
      } : {
        name: "PostNotFoundError",
        message: "That post does not exist"
      });
    }

  } catch ({ name, message }) {
    next({ name, message })
  }
});

postsRouter.get('/', async (req, res) => {
  try {
    const allPosts = await getAllPosts();

    const posts = allPosts.filter(post => {
      // keep a post if it is either active, or if it belongs to the current user
      if (post.active) {
        return true;
      }
    
      // the post is not active, but it belogs to the current user
      if (req.user && post.author.id === req.user.id) {
        return true;
      }
    
      // none of the above are true
      return false;
    });

    res.send({
      posts
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});
