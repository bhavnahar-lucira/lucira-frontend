export const GET_PAGES_QUERY = `
  query GetPages($first: Int!, $after: String) {
    pages(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
          body
          bodySummary
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const GET_BLOGS_QUERY = `
  query GetBlogs($first: Int!, $after: String) {
    blogs(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
          articles(first: 250) {
            edges {
              node {
                id
                title
                handle
                content
                contentHtml
                excerpt
                excerptHtml
                publishedAt
                authorV2 {
                  name
                }
                image {
                  url
                  altText
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_ARTICLES_QUERY = `
  query GetArticles($first: Int!, $after: String) {
    articles(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
          content
          contentHtml
          excerpt
          excerptHtml
          publishedAt
          authorV2 {
            name
          }
          image {
            url
            altText
          }
          author_name: metafield(namespace: "custom", key: "author_name") { value }
          authors_image: metafield(namespace: "custom", key: "authors_image") { 
            value 
            reference {
              ... on MediaImage {
                image {
                  url
                }
              }
            }
          }
          authors_description: metafield(namespace: "custom", key: "authors_description") { value }
          authors_linkedin: metafield(namespace: "custom", key: "authors_linkedin") { value }
          views: metafield(namespace: "custom", key: "views") { value }
          blog {
            id
            handle
            title
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_COLLECTIONS_QUERY = `
  query GetCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_ALL_PRODUCTS_QUERY = `
  query GetAllProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

