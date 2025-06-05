let $creationalForm = undefined
let $favouriteRecipes = undefined

const CONFIG = {
  ownRecipesKey: 'ownRecipes'
}

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

  $creationalForm = document.getElementById('create-recipe-form')
  $creationalForm.addEventListener('submit', createSubmitHandler)
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
  favouriteList.forEach((item, ind) => {
    const {
      label,
      imageUrl,
      cuisineType,
      dishType,
      cautions,
      ingredientLines,
      totalTime,
      totalWeight,
      url
    } = item

    template += `
        <div class='col'>
          <div class='card found-item favourite-item' data-label='${label}'>
            <img src='${imageUrl}' class='card-img-top' alt='${label}'>
            <div class='card-body'>
              <h5 class='card-title'>${label}</h5>
              <button type='button' class='btn btn-danger favourite-delete-btn'>
                <i class='fa-solid fa-xmark'></i>
              </button>
              <ul class='list-group list-group-flush'>
                <li class='list-group-item'>
                  ${dishType.map(dish => `<span class='badge text-bg-dark d-inline-block mb-1'>${dish}</span>`).join('')}
                  ${cuisineType.map(cuisine => `<span class='badge text-bg-success d-inline-block mb-1'>${cuisine}</span>`).join('')}
                </li>
                <li class='list-group-item'>
                  <span class='badge text-bg-secondary'>cooking time: ${totalTime} min</span>
                </li>
                <li class='list-group-item'>
                  <span class='badge text-bg-secondary'>total weight: ${Math.round(totalWeight)} g</span>
                </li>
                <li class='list-group-item'>
                  ${cautions.map(caution => `<span class='badge text-bg-danger d-inline-block'>${caution}</span>`).join('')}
                </li>
              </ul>
              
              <div class='accordion mt-2 mb-2' id='accordion_${ind}'>
                <div class='accordion-item'>
                  <h2 class='accordion-header'>
                    <button class='accordion-button' type='button' data-bs-toggle='collapse' data-bs-target='#collapse-${ind}' aria-expanded='true' aria-controls='collapse-${ind}'>
                      Ingredient:
                    </button>
                  </h2>
                  <div id='collapse-${ind}' class='accordion-collapse collapse' data-bs-parent='#accordion_${ind}'>
                    <div class='accordion-body'>
                      ${ingredientLines.map(ingredient => `<p class='mb-1'>- ${ingredient}</p>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
              
              <a href='${url}' class='btn btn-dark recipe-link' target='_blank'>recipe <i class="fa-solid fa-link"></i></a>
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

function createSubmitHandler(event) {
  event.preventDefault()

  let existingOwnRecipes = localStorage.getItem(CONFIG.ownRecipesKey)

  if (!existingOwnRecipes) {
    existingOwnRecipes = []
  } else {
    existingOwnRecipes = JSON.parse(existingOwnRecipes)
  }

  const formData = new FormData($creationalForm)

  const label = formData.get('recipe-name')?.trim()
  const ingredients = formData.get('ingredients')?.trim()
  const instructions = formData.get('instructions')?.trim()
  const time = formData.get('create-recipe-time')
  const weight = formData.get('create-recipe-weight')

  const diets = []
  $creationalForm.querySelectorAll('#create-recipe-diets input[type="checkbox"]:checked')
    .forEach(input => diets.push(input.name))

  const allergies = []
  $creationalForm.querySelectorAll('#create-recipe-allergies input[type="checkbox"]:checked')
    .forEach(input => allergies.push(input.name))

  const recipe = {
    label,
    ingredients,
    instructions,
    time,
    weight,
    diets,
    allergies,
    creationDate: new Date().toLocaleDateString()
  }

  existingOwnRecipes.push(recipe)
  localStorage.setItem(CONFIG.ownRecipesKey, JSON.stringify(existingOwnRecipes))

  $modal = document.getElementById('create-recipe')
  const modal = bootstrap.Modal.getInstance($modal)
  modal.hide()

  this.reset()
}