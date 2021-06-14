function main() {
  const appElement = document.querySelector('#app')
  if (appElement) {
    appElement.textContent = 'Hello, World!'
  }
}

document.addEventListener('DOMContentLoaded', main)
