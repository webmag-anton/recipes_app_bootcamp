let $favouriteRecipes = undefined
const emptyFavouriteListTemplate =
  '<p>list of <i class="fa-solid fa-star"></i> recipes is empty :(</p>'

document.addEventListener('DOMContentLoaded', () => {
  $favouriteRecipes = document.getElementById('favourite-recipes')
  const favouriteList = JSON.parse(localStorage.getItem('favouriteRecipes'))

  if (!favouriteList || !favouriteList.length) {
    render($favouriteRecipes, undefined)
  } else {
    render($favouriteRecipes, favouriteList)
  }
})

function render($container, favouriteList) {
  if (favouriteList === undefined) {
    $container.innerHTML = emptyFavouriteListTemplate
  } else {
    const template = getRecipesTemplate(favouriteList)
    $container.innerHTML = template
    addDeletionListener()
  }
}

function getRecipesTemplate(favouriteList) {
  let template = ''
  favouriteList.forEach(({label, imageUrl}) => {
    template += `      
        <div class='col'>
          <div class='card favourite-item' data-label='${label}'>
            <img src='${imageUrl}' class='card-img-top' alt='${label}'>
            <div class='card-body'>
              <h5 class='card-title'>${label}</h5>
              <p class='card-text'>This content is a little bit longer.</p>
              <button type='button' class='btn btn-danger favourite-delete-btn'>
                <i class='fa-solid fa-xmark'></i>
              </button>
            </div>
          </div>
        </div>
      `
  })
  return template
}

function addDeletionListener() {
  const $favouriteItems = $favouriteRecipes.getElementsByClassName('favourite-item')

  Array.from($favouriteItems).forEach(item => {
    const $deleteButton = item.getElementsByClassName('favourite-delete-btn')[0]

    $deleteButton.addEventListener('click', function() {
      const recipeLabel = this.closest('.favourite-item').dataset.label

      const favouriteList = JSON.parse(localStorage.getItem('favouriteRecipes'))
      const filteredFavouriteList = favouriteList.filter(item => item.label !== recipeLabel)

      localStorage.setItem('favouriteRecipes', JSON.stringify(filteredFavouriteList))

      item.classList.add('animated')
      setTimeout(() => {
        item.parentElement.remove()
        if (!JSON.parse(localStorage.getItem('favouriteRecipes')).length) {
          $favouriteRecipes.innerHTML = emptyFavouriteListTemplate
        }
      }, 500)
    })
  })
}