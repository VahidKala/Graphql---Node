const { buildSchema } = require("graphql");

const schema = buildSchema(`
    type Posts {
      _id: ID!
      title: String!
      content: String!
      imageUrl: String!
      creator: User!
      createdAt: String!
      updatedAt: String!
    }

    type User {
      _id: ID!
      email: String!
      password: String!
      name: String!
      posts: [Posts!]!
    }

    input UserInputData {
      email: String!
      password: String!
      name: String
    }

    type AuthData {
      token: String!
      userId: ID!
    }

    input Page {
      pageNum: Int!
    }

    type UserNameAndId {
      _id: ID!
      name: String!
    }

    type ItemInfo {
      _id: ID!
      title: String!
      content: String!
      creator: UserNameAndId!
      imageUrl: String!
      createdAt: String!
      totalPages: Int!
    }

    type Logout {
      trueOrFalse: Boolean!
    }

    input ItemInformation {
      title: String!
      content: String!
      imageUrl: String!
    }

    type CreatedPost {
      _id: ID!
      title: String!
      content: String!
      imageUrl: String!
      creator: UserNameAndId!
      createdAt: String!
      updatedAt: String!
    }

    input itemIdd {
      itemId: String!
    }

    type ViewInfoBack {
      title: String!
      content: String!
      imageUrl: String!
    }

    input editInfo {
      postId: ID!
      title: String!
      content: String!
      imageUrl: String
    }

    type editedItem {
      _id: ID!
      title: String!
      content: String!
      imageUrl: String!
    }

    input idOfItem {
      itemId: ID!
    }

    type ResultOfDeletion {
      message: String!
    }

    type RootQuery {
      getItems(userInputs: Page): [ItemInfo!]!
      viewDetails(viewItemId: itemIdd!): ViewInfoBack!
      }
      
    type RootMutation {
        createUser(userInputs: UserInputData): User!
        loginUser(userInputs: UserInputData): AuthData!
        logoutUser: Logout!
        postItems(postInputs: ItemInformation): CreatedPost!
        editItem(userInputs: editInfo): editedItem!
        deleteItem(postId: idOfItem): ResultOfDeletion!
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
`);

module.exports = schema;
