let $ownRecipes = undefined
let $creationalForm = undefined

const CONFIG = {
  ownRecipesKey: 'ownRecipes'
}

const emptyOwnListTemplate =
  '<p>You have not created any recipes...</p>'

document.addEventListener('DOMContentLoaded', () => {
  $ownRecipes = document.getElementById('own-recipes')
  const ownList = JSON.parse(localStorage.getItem('ownRecipes'))

  if (!ownList || !ownList.length) {
    render($ownRecipes, undefined)
  } else {
    render($ownRecipes, ownList)
  }

  $creationalForm = document.getElementById('create-recipe-form')
  $creationalForm.addEventListener('submit', createSubmitHandler)
})

function render($container, ownList) {
  if (ownList === undefined) {
    $container.innerHTML = emptyOwnListTemplate
  } else {
    const template = getRecipesTemplate(ownList)
    $container.innerHTML = template
    addDeletionListener()
  }
}

function getRecipesTemplate(ownList) {
  let template = ''
  ownList.forEach((item, ind) => {
    const {
      label,
      ingredients,
      instructions,
      time,
      weight,
      diets,
      allergies,
      creationDate = undefined
    } = item

    template += `
        <div class='col'>
          <div class='card found-item own-item' data-label='${label}'>
            <div class='card-body'>
              <h5 class='card-title text-center'>${label}</h5>
              <button type='button' class='btn btn-danger own-delete-btn mb-2'>
                <i class='fa-solid fa-xmark'></i>
              </button>
              <ul class='list-group list-group-flush'>
                ${!diets.length ? '' : `
                  <li class='list-group-item'>
                    ${diets.map(diet => `<span class='badge text-bg-primary d-inline-block mb-1'>${diet}</span>`).join('')}
                  </li>`}
                  
                ${!allergies.length ? '' : `
                  <li class='list-group-item'>
                    ${allergies.map(allergie => `<span class='badge text-bg-success d-inline-block mb-1'>${allergie}</span>`).join('')}
                  </li>`}
                
                <li class='list-group-item mt-2'>
                  <p class='mb-1 text-decoration-underline'><b>ingredients:</b></p>
                  ${ingredients.split('\n').map(item => `<p class='mb-1'>${item}</p>`).join('')}
                </li>
                <li class='list-group-item mt-2'>
                  <p class='mb-1 text-decoration-underline'><b>instructions:</b></p>
                  ${instructions.split('\n').map(item => `<p class='mb-1'>${item}</p>`).join('')}
                </li>
                
                ${time && `
                <li class='list-group-item'>
                  <span class='badge text-bg-secondary'>cooking time: ${time} min</span>
                </li>`}
                
                ${weight && `
                <li class='list-group-item'>
                  <p class='badge text-bg-secondary mb-0'>total weight: ${Math.round(weight)} g</p>
                </li>`}
                
                ${creationDate && `
                <li class='list-group-item mt-2'>
                  <p class='mb-0'>created: ${creationDate && creationDate}</p>
                </li>`}
              </ul>
              
            </div>
          </div>
        </div>
      `
  })
  return template
}

function addDeletionListener() {
  const $ownItems = $ownRecipes.getElementsByClassName('own-item')

  Array.from($ownItems).forEach(item => {
    const $deleteButton = item.getElementsByClassName('own-delete-btn')[0]

    $deleteButton.addEventListener('click', function() {
      const recipeLabel = this.closest('.own-item').dataset.label

      const ownList = JSON.parse(localStorage.getItem('ownRecipes'))
      const filteredOwnList = ownList.filter(item => item.label !== recipeLabel)

      localStorage.setItem('ownRecipes', JSON.stringify(filteredOwnList))

      item.classList.add('animated')
      setTimeout(() => {
        item.parentElement.remove()
        if (!JSON.parse(localStorage.getItem('ownRecipes')).length) {
          $ownRecipes.innerHTML = emptyOwnListTemplate
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

  const ownList = JSON.parse(localStorage.getItem('ownRecipes'))
  render($ownRecipes, ownList)
}