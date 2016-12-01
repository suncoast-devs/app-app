<% if (webpack) { %>if (process.env.NODE_ENV !== 'production') require('./index.html')
import './styles/screen.<%= styleExt %>'

<% } %>const main = () => {
  document.querySelector('h1').textContent += '?'
}

document.addEventListener('DOMContentLoaded', main)
<% if (webpack) { %>
if (module.hot) {
  module.hot.dispose(() => window.location.reload())
  module.hot.accept(err => console.error(err))
}<% } %>
