<% if (webpack) { %>import 'file!./index.html'
import './styles/screen.sass'

<% } %>const main = () => {
  document.getElementById('root').textContent = 'Hello, World!'
}

document.addEventListener('DOMContentLoaded', main)
<% if (webpack) { %>
if (module.hot) {
  module.hot.accept()
  module.hot.accept('file!./index.html', () => {
    window.location.reload()
  })
}<% } %>
