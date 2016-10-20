<% if (webpack) { %>import 'file!./index.html'
import './styles/screen.sass'

<% } %>const main = () => {
  console.log('Hello, World!')
}

document.addEventListener('DOMContentLoaded', main)
