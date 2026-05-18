
const { MongoClient } = require('mongodb');

async function checkTags() {
  const uri = "mongodb://admin:password123@localhost:27017/next_local_db?authSource=admin";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    
    console.log("Checking articles for tags...");
    const article = await db.collection("articles").findOne({ tags: { $exists: true, $not: { $size: 0 } } });
    console.log("Article with tags sample:", JSON.stringify(article?.tags, null, 2));

    console.log("\nChecking blogs for all_tags...");
    const blog = await db.collection("blogs").findOne({ handle: "stories" });
    console.log("Blog 'stories' sample:", JSON.stringify({ 
      title: blog?.title, 
      handle: blog?.handle, 
      tags: blog?.all_tags 
    }, null, 2));

    const allArticlesCount = await db.collection("articles").countDocuments({ blogHandle: "stories" });
    console.log("\nTotal articles for 'stories':", allArticlesCount);

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
checkTags();
