const fs = require('fs')
const kebabCase = require('lodash/kebabCase')
const statuses = require('./ci/statuses')

const kebabStatuses = statuses.map(kebabCase)

const Frontmatter = `
  fragment Frontmatter on MarkdownRemarkFrontmatter {
    sep
    sccp
    title
    author
    network
    type
    proposal
    implementor
    release
    created
    updated
    status
  }
`
const allSepsQuery = `
  ${Frontmatter}
  query allSeps {
    allMarkdownRemark(
      filter: {
        fileAbsolutePath: { regex: "/seps/" }
        frontmatter: { sep: { ne: null } }
      }
    ) {
      group(field: frontmatter___status) {
        fieldValue
        nodes {
          frontmatter {
            ...Frontmatter
          }
          md: rawMarkdownBody
          html
        }
      }
    }
  }
`

const allSccpQuery = `
  ${Frontmatter}
  query allSeps {
    allMarkdownRemark(
      filter: {
        fileAbsolutePath: { regex: "/sccp/" }
        frontmatter: { sccp: { ne: null } }
      }
    ) {
      group(field: frontmatter___status) {
        fieldValue
        nodes {
          frontmatter {
            ...Frontmatter
          }
          md: rawMarkdownBody
          html
        }
      }
    }
  }
`

exports.onPostBuild = async ({ graphql }) => {
  const allSeps = await graphql(allSepsQuery)
  const allSccp = await graphql(allSccpQuery)

  const sepsPath = './public/api/seps'
  const sccpPath = './public/api/sccp'

  ;[
    { path: sepsPath, result: allSeps },
    { path: sccpPath, result: allSccp },
  ].forEach(({ path, result }) => {
    if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true })

    // Initialize all statuses with empty array
    kebabStatuses.forEach((status) =>
      fs.writeFileSync(`${path}/${status}.json`, JSON.stringify([])),
    )

    result.data.allMarkdownRemark.group.forEach((group) => {
      const status = kebabCase(group.fieldValue)
      const data = group.nodes.map(({ frontmatter, ...node }) => ({
        ...frontmatter,
        ...node,
      }))
      fs.writeFileSync(`${path}/${status}.json`, JSON.stringify(data))
    })
  })
}

exports.createSchemaCustomization = ({ actions, schema }) => {
  const { createTypes } = actions
  const typeDefs = [
    `
    type MarkdownRemarkFrontmatter implements Node {
      title: String!
      type: String
      network: String
      status: String!
      author: String!
      implementor: String
      proposal: String
      release: String
      created: Date
      updated: Date
      sep: Int
    }
  `,
    // schema.buildObjectType({
    //   name: 'Frontmatter',
    //   fields: {
    //     tags: {
    //       type: 'String!',
    //       resolve(source, args, context, info) {
    //         const { tags } = source
    //         console.log(source)
    //         switch (source[info.fieldName]) {
    //           case 'type':
    //             return 'TBD'
    //           case 'implementor':
    //             return 'TBD'
    //           default:
    //             return tags
    //         }
    //       },
    //     },
    //   },
    // }),
  ]
  createTypes(typeDefs)
}
