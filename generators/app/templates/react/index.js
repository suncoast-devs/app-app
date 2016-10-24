import React from 'react'
import { render } from 'react-dom'
import App from './components/App'

import './styles/screen.<%= styleExt %>'

const root = document.getElementById('root')

const render = (app) => {
  ReactDOM.render(
    <AppContainer>{app}</AppContainer>,
    root
  )
}

render(<App />)

if (module.hot) {
  module.hot.accept('./components/App', () => {
    const NextApp = require('./components/App').default
    render(<NextApp />)
  })
}
