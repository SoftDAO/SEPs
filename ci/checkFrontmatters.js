const Yup = require('yup')
const glob = require('glob')
const fm = require('front-matter')
const statuses = require('./statuses')
const fs = require('fs/promises')
const { promisify } = require('util')
const g = promisify(glob)
const tallyIdRegex = /^https?:\/\/(tally.xyz).*\/([A-z0-9]{7,})$/
const commonValidationSchema = Yup.object().shape({
  file: Yup.string().required(),
  title: Yup.string().required(),
  type: Yup.string()
    .oneOf([
      'Meta-Governance',
      'Governance',
      'Process',
      'Request for Enhancement',
      'Software',
    ])
    .required(),
  proposal: Yup.string().matches(tallyIdRegex).nullable(), // Made optional
  status: Yup.string().oneOf(statuses),
  author: Yup.string().required(),
  network: Yup.string()
    .oneOf(['Ethereum', 'Optimism', 'Ethereum & Optimism', 'Unknown'])
    .required(),
  implementor: Yup.string().nullable(),
  release: Yup.string().nullable(),
  created: Yup.date().nullable(),
  updated: Yup.date().nullable(),
  requires: Yup.mixed().nullable(),
  'discussions-to': Yup.string().nullable(),
})
const sepValidationSchema = commonValidationSchema
  .concat(
    Yup.object().shape({
      sep: Yup.number().required(),
      network: Yup.string().required(),
    }),
  )
  .noUnknown()
  .strict()
const sccpValidationSchema = commonValidationSchema
  .concat(
    Yup.object().shape({
      sccp: Yup.number().required(),
    }),
  )
  .noUnknown()
  .strict()
;(async () => {
  try {
    const seps = await g('./content/seps/*.md')
    const sccp = await g('./content/sccp/*.md')
    // SEP
    await Promise.all(
      seps.map(async (file) => {
        const content = await fs.readFile(file, 'utf-8')
        const { attributes } = fm(content)
        const castValues = sepValidationSchema.cast({ file, ...attributes })
        return await sepValidationSchema.validate(castValues)
      }),
    )
    // SCCP
    await Promise.all(
      sccp.map(async (file) => {
        const content = await fs.readFile(file, 'utf-8')
        const { attributes } = fm(content)
        const castValues = sccpValidationSchema.cast({ file, ...attributes })
        return await sccpValidationSchema.validate(castValues)
      }),
    )
  } catch (error) {
    console.log(error)
    console.error({
      value: error.value,
      errors: error.errors,
    })
    process.exit(1)
  }
})()
