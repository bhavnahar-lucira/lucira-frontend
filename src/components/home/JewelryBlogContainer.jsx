import { getArticlesByBlogHandleStorefront } from "@/lib/blogs";
import JewelryBlog from "./JewelryBlog";

export default async function JewelryBlogContainer() {
  try {
    const articles = await getArticlesByBlogHandleStorefront("stories");
    const latestArticles = articles.slice(0, 4);
    
    return <JewelryBlog articles={latestArticles} />;
  } catch (error) {
    console.error("Error fetching homepage blogs:", error);
    return null;
  }
}
