const express = require('express');
const tagsRouter = express.Router();

const { getPostsByTagName } = require('../db')

tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");

  next();
});

const { getAllTags } = require('../db');

tagsRouter.get('/', async (req, res) => {
    const tags = await getAllTags();
    

    res.send({
    tags 
  });
});




//NEED TO import the appropriate function from our database layer.
tagsRouter.get('/:tagName/posts', async (req, res, next) => {
  // read the tagname from the params
  try {
    
    const { tags:posts } = await getPostsByTagName(req.params.tagName);

    if(posts) {
      res.send({posts});
    }
    
  } catch ({ name, message }) {
    next({name, message})
 
  }
});

module.exports = tagsRouter;