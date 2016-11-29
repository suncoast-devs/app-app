<% if (webpack) { %>import './index.html'
import './styles/screen.sass'

<% } %>const main = () => {
  document.querySelector('h1').textContent += '?'
}

document.addEventListener('DOMContentLoaded', main)
<% if (webpack) { %>
if (module.hot) {
  module.hot.dispose(() => window.location.reload())
  module.hot.accept(err => console.error(err))
}<% } %>
