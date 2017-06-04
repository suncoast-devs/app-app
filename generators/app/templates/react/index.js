import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import Redbox from 'redbox-react'

import App from './components/App'

import './styles/screen.<%= styleExt %>'

const root = document.getElementById('root')

const render = app => {
  ReactDOM.render(
    <AppContainer errorReporter={Redbox}>{app}</AppContainer>,
    root
  )
}

render(<App />)


if (module.hot) {
  module.hot.accept('./components/App', () => { render(App) })
}
