function main() {
  if (document.querySelector('#app')) {
    document.querySelector('#app').textContent = 'Hello, World!'
  }
}

document.addEventListener('DOMContentLoaded', main)
