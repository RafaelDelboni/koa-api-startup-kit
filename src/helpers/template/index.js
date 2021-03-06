const { join } = require('path')
const load = require('./load')
const diretory = join(__dirname, 'layouts')

const layouts = load(diretory)

function render (layout, data = {}) {
  const template = layouts.get(layout)
  if (!template && typeof template !== 'function') {
    throw new Error(`Template ${layout} not found`)
  }
  return template(data)
}

module.exports = render
