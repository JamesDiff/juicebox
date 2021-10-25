const { Client } = require('pg'); 

const client = new Client('postgres://localhost:5432/juicebox-dev');

async function createUser({ 
    username, 
    password,
    name,
    location
}) {
    try {
      const { rows } = await client.query(`
      INSERT INTO users(username, password, name, location) 
      VALUES($1, $2, $3, $4) 
      ON CONFLICT (username) DO NOTHING 
      RETURNING *;
        `, [username, password, name, location]);
  
      return rows;
    } catch (error) {
      throw error;
    }
  }


async function updateUser(id, fields = {}) {
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    // return early if this is called without fields
    if (setString.length === 0) {
      return;
    }
  
    try {
      const { rows: [user] } = await client.query(`
        UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
      `, Object.values(fields));
  
      return user;
    } catch (error) {
      throw error;
    }
  }


async function getAllUsers() {
  try {
    const { rows } = await client.query(`
      SELECT id, username, name, location, active
      FROM users;
    `);
    return rows;
  } catch (error) {
    throw error;
  } 
}


async function getUserById(userId) {
  try {
    const { rows: [ user ] } = await client.query(`
      SELECT id, username, name, location, active
      FROM users
      WHERE id=${ userId }
    `);
  
  if (!user) {
    return null
  }
  
  user.posts = await getPostsByUser(userId);
  
  return user;
  } catch (error) {
    throw error;
  }
}


async function createPost({
  authorId,
  title,
  content,
  tags = []
}) {
  try {
    const { rows: [ post ] } = await client.query(`
    INSERT INTO posts("authorId", title, content) 
    VALUES($1, $2, $3)
    RETURNING *;
  `, [authorId, title, content]);

  const tagList = await createTags(tags);

  return await addTagstoPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
  }

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function updatePost(id, fields = {}) {

  const {tags} = fields;
  delete fields.tags;

  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  try {
    if (setString.length > 0) {
      await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ postId }
        RETURNING *;
      `, Object.values(fields));
    }

    if (tags === undefined) {
      return await getPostById(postId);
    }

    const tagList = await createTags(tags);
    const tagListIdString = tagList.map(
      tag => `${ tag.id }`
    ).join(', ');

    await client.query(`
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${ tagListIdString })
      AND "postId"=$1;
    `, [postId]);

    await addTagsToPost(postId, tagList);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
  
   
}



async function getAllPosts() {
  try {
    const { rows: postIds } = await client.query(`
      SELECT id
      FROM posts;
    `);

    const posts = await Promise.all(postIds.map(
      post => getPostById( post.id )
    ));

    return posts;

  } catch (error) {
    throw error;
  }
}


async function getPostsByUser(userId) {
  try {
    const { rows: postIds } = await client.query(`
      SELECT * 
      FROM posts
      WHERE "authorId"=${ userId };
    `);

    const posts =  await Promise.all(postIds.map(
      post => getPostById( post.id )
    ));

    return posts;
  } catch (error) {
    throw error;
  }
}


  // and export them
  module.exports = {
    client,
    createUser, 
    updateUser,
    getAllUsers,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    addTagstoPost
  }
  
